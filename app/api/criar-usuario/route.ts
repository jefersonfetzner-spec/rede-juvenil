import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente ADMIN do Supabase (usa service_role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, senha, nome, role, telefone } = body

        // Validações
        if (!email || !senha || !nome || !role) {
            return NextResponse.json(
                { error: 'Dados obrigatórios faltando' },
                { status: 400 }
            )
        }

        if (!['lider', 'ministro', 'pai', 'juvenil'].includes(role)) {
            return NextResponse.json(
                { error: 'Role inválido' },
                { status: 400 }
            )
        }

        // 1. Criar usuário no Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: senha,
            email_confirm: true, // Já confirma o email
            user_metadata: {
                nome: nome,
                role: role
            }
        })

        if (authError) {
            console.error('Erro ao criar auth:', authError)
            
            if (authError.message.includes('already registered')) {
                return NextResponse.json(
                    { error: 'Este email já está cadastrado' },
                    { status: 400 }
                )
            }
            
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Erro ao criar usuário' },
                { status: 500 }
            )
        }

        // 2. Atualizar o perfil (o trigger já criou, só ajustamos)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                nome: nome,
                role: role,
                telefone: telefone || null,
                ativo: true
            })
            .eq('id', authData.user.id)

        if (profileError) {
            console.error('Erro ao atualizar perfil:', profileError)
            // Não vamos travar por causa disso, o perfil foi criado
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                nome: nome,
                role: role
            }
        })

    } catch (error: unknown) {
        console.error('Erro geral:', error)
        const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
        return NextResponse.json(
            { error: mensagem },
            { status: 500 }
        )
    }
}