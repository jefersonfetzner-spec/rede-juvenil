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
    const [sucesso, setSucesso] = useState<{email: string, senha: string, nome: string} | null>(null)

    // Campos
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [dataNascimento, setDataNascimento] = useState('')
    const [alergias, setAlergias] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [criarLogin, setCriarLogin] = useState(true)

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
            return
        }

        // Se marcou criar login mas não colocou email
        if (criarLogin && !email.trim()) {
            setErro('Digite um email ou desmarque "Criar login de acesso"')
            return
        }

        setSalvando(true)

        try {
            let profileId = null

            // Se marcou criar login, criar usuário
            if (criarLogin && email.trim()) {
                const senhaInicial = 'rede123'

                const response = await fetch('/api/criar-usuario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: email.trim(),
                        senha: senhaInicial,
                        nome: nome.trim(),
                        role: 'juvenil'
                    })
                })

                const resultado = await response.json()

                if (!response.ok) {
                    throw new Error(resultado.error || 'Erro ao criar usuário')
                }

                profileId = resultado.user.id
            }

            // Cadastrar juvenil
            const { error: juvenilError } = await supabase
                .from('juvenis')
                .insert({
                    profile_id: profileId,
                    nome: nome.trim(),
                    data_nascimento: dataNascimento,
                    alergias: alergias.trim() || null,
                    observacoes: observacoes.trim() || null,
                    status: 'ativo'
                })

            if (juvenilError) throw juvenilError

            if (criarLogin && email.trim()) {
                setSucesso({
                    email: email.trim(),
                    senha: 'rede123',
                    nome: nome.trim()
                })
            } else {
                alert(`✅ ${nome} cadastrado(a) com sucesso!`)
                router.push('/juvenis')
            }

            setSalvando(false)
        } catch (error: unknown) {
            const mensagem = error instanceof Error ? error.message : 'Erro ao cadastrar'
            setErro(mensagem)
            setSalvando(false)
        }
    }

    function copiarCredenciais() {
        if (!sucesso) return
        const texto = `🙏 Rede Juvenil - Seu Login\n\n📧 Email: ${sucesso.email}\n🔐 Senha: ${sucesso.senha}\n\n🔗 Acesse: https://rede-juvenil.vercel.app/login\n\nAo entrar, recomendamos trocar sua senha!`
        navigator.clipboard.writeText(texto)
        alert('✅ Credenciais copiadas! Cole no WhatsApp para enviar')
    }

    function enviarWhatsApp() {
        if (!sucesso) return
        const texto = `🙏 *Rede Juvenil - Seu Login*%0A%0A📧 *Email:* ${sucesso.email}%0A🔐 *Senha:* ${sucesso.senha}%0A%0A🔗 *Acesse:* https://rede-juvenil.vercel.app/login%0A%0AAo entrar, recomendamos trocar sua senha!`
        window.open(`https://wa.me/?text=${texto}`, '_blank')
    }

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-6xl animate-bounce">⏳</div>
            </div>
        )
    }

    if (!perfil) return null

    // TELA DE SUCESSO
    if (sucesso) {
        return (
            <div className="min-h-screen bg-gray-100 flex">
                <Sidebar 
                    nomeUsuario={perfil.nome}
                    emailUsuario={perfil.email}
                    roleUsuario={perfil.role}
                />
                <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                    <div className="max-w-2xl mx-auto mt-14 lg:mt-0">
                        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border-2 border-green-500">
                            <div className="text-center mb-6">
                                <div className="text-6xl mb-4">🎉</div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    Cadastrado com sucesso!
                                </h1>
                                <p className="text-gray-600">
                                    <strong>{sucesso.nome}</strong> foi adicionado(a) ao ministério
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                                    🔐 Credenciais de Acesso
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                                        <p className="text-lg font-mono font-bold text-gray-800 break-all">{sucesso.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Senha Inicial</p>
                                        <p className="text-lg font-mono font-bold text-gray-800">{sucesso.senha}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Link de Acesso</p>
                                        <p className="text-sm font-mono text-blue-600 break-all">https://rede-juvenil.vercel.app/login</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ <strong>Importante:</strong> Compartilhe essas credenciais com o(a) responsável de {sucesso.nome}.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <button onClick={copiarCredenciais} className="bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2">
                                    📋 Copiar Credenciais
                                </button>
                                <button onClick={enviarWhatsApp} className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                                    💬 Enviar por WhatsApp
                                </button>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <Link href="/juvenis" className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition">
                                    Ver Lista de Juvenis
                                </Link>
                                <button
                                    onClick={() => {
                                        setSucesso(null)
                                        setNome('')
                                        setEmail('')
                                        setDataNascimento('')
                                        setAlergias('')
                                        setObservacoes('')
                                    }}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition"
                                >
                                    ➕ Cadastrar Outro
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <Sidebar 
                nomeUsuario={perfil.nome}
                emailUsuario={perfil.email}
                roleUsuario={perfil.role}
            />

            <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                
                <div className="bg-white rounded-2xl shadow p-6 mb-6 mt-14 lg:mt-0">
                    <Link href="/juvenis" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Juvenil
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Preencha os dados da criança
                    </p>
                </div>

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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                disabled={salvando}
                            />
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                placeholder="Ex: Amendoim, leite (deixe em branco se não houver)"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 resize-none"
                                placeholder="Alguma informação importante..."
                                disabled={salvando}
                            />
                        </div>

                        {/* Criar Login */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={criarLogin}
                                    onChange={(e) => setCriarLogin(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                                    disabled={salvando}
                                />
                                <div>
                                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                                        🔐 Criar login de acesso para o juvenil
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Marque para que o juvenil possa acessar o sistema com login próprio
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Email (só aparece se criar login) */}
                        {criarLogin && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email para Login <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                    placeholder="juvenil@email.com"
                                    disabled={salvando}
                                />
                                <p className="text-xs text-blue-600 mt-1">
                                    🔐 Será criado login automático com senha inicial &quot;rede123&quot;
                                </p>
                            </div>
                        )}

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link href="/juvenis" className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Cadastrando...' : '💾 Cadastrar Juvenil'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}