'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

interface Perfil {
    id: string
    nome: string
    email: string
    role: string
}

export default function NovoJuvenilPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    // Campos do formulário
    const [nome, setNome] = useState('')
    const [dataNascimento, setDataNascimento] = useState('')
    const [alergias, setAlergias] = useState('')
    const [observacoes, setObservacoes] = useState('')

    useEffect(() => {
        verificarUsuario()
    }, [])

    async function verificarUsuario() {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: perfilData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (!perfilData || perfilData.role !== 'lider') {
                router.push('/dashboard')
                return
            }

            setPerfil(perfilData)
        } catch (error) {
            console.error('Erro:', error)
            router.push('/login')
        } finally {
            setCarregando(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErro('')
        setSalvando(true)

        try {
            // Validar idade
            const hoje = new Date()
            const nasc = new Date(dataNascimento)
            let idade = hoje.getFullYear() - nasc.getFullYear()
            const mes = hoje.getMonth() - nasc.getMonth()
            if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
                idade--
            }

            if (idade < 5 || idade > 15) {
                setErro(`Idade calculada: ${idade} anos. A faixa é de 10 a 12 anos, mas aceita 5-15.`)
                setSalvando(false)
                return
            }

            const { error } = await supabase
                .from('juvenis')
                .insert({
                    nome: nome.trim(),
                    data_nascimento: dataNascimento,
                    alergias: alergias.trim() || null,
                    observacoes: observacoes.trim() || null,
                    status: 'ativo'
                })

            if (error) throw error

            alert(`✅ ${nome} cadastrado(a) com sucesso!`)
            router.push('/juvenis')
        } catch (error: unknown) {
            const mensagem = error instanceof Error ? error.message : 'Erro ao cadastrar'
            setErro(mensagem)
            setSalvando(false)
        }
    }

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-6xl animate-bounce">⏳</div>
            </div>
        )
    }

    if (!perfil) return null

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar 
                nomeUsuario={perfil.nome}
                emailUsuario={perfil.email}
                roleUsuario={perfil.role}
            />

            <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                
                {/* Cabeçalho */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6 mt-14 lg:mt-0">
                    <div className="flex items-center gap-3 mb-2">
                        <Link
                            href="/juvenis"
                            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                        >
                            ← Voltar
                        </Link>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        ➕ Novo Juvenil
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Preencha os dados da criança
                    </p>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 lg:p-8 max-w-2xl">
                    
                    <div className="space-y-5">
                        
                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                                placeholder="Ex: Maria Silva Santos"
                                disabled={salvando}
                            />
                        </div>

                        {/* Data Nascimento */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Data de Nascimento <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={dataNascimento}
                                onChange={(e) => setDataNascimento(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                                disabled={salvando}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                A idade será calculada automaticamente
                            </p>
                        </div>

                        {/* Alergias */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Alergias Alimentares
                            </label>
                            <input
                                type="text"
                                value={alergias}
                                onChange={(e) => setAlergias(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                                placeholder="Ex: Amendoim, leite, etc. (deixe em branco se não houver)"
                                disabled={salvando}
                            />
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Importante para a escala de lanches
                            </p>
                        </div>

                        {/* Observações */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Observações
                            </label>
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 resize-none"
                                placeholder="Alguma informação importante sobre a criança..."
                                disabled={salvando}
                            />
                        </div>

                        {/* Erro */}
                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                            <Link
                                href="/juvenis"
                                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Salvando...' : '💾 Cadastrar Juvenil'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}