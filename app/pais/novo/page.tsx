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

interface JuvenilOpcao {
    id: string
    nome: string
}

const OPCOES_PARENTESCO = [
    { valor: 'pai', label: '👨 Pai' },
    { valor: 'mae', label: '👩 Mãe' },
    { valor: 'avo', label: '👴 Avô' },
    { valor: 'avoh', label: '👵 Avó' },
    { valor: 'tio', label: '🧔 Tio' },
    { valor: 'tia', label: '👩‍🦰 Tia' },
    { valor: 'padrasto', label: '👨 Padrasto' },
    { valor: 'madrasta', label: '👩 Madrasta' },
    { valor: 'tutor', label: '⚖️ Tutor Legal' },
    { valor: 'responsavel', label: '🤝 Responsável' },
    { valor: 'outro', label: '➕ Outro (especificar)' },
]

export default function NovoPaiPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [juvenisDisponiveis, setJuvenisDisponiveis] = useState<JuvenilOpcao[]>([])
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')
    const [sucesso, setSucesso] = useState<{email: string, senha: string, nome: string} | null>(null)

    // Campos
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [parentesco, setParentesco] = useState('responsavel')
    const [parentescoOutro, setParentescoOutro] = useState('')
    const [telefone, setTelefone] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [juvenisSelecionados, setJuvenisSelecionados] = useState<string[]>([])

    useEffect(() => {
        inicializar()
    }, [])

    async function inicializar() {
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

            const { data: juvenisData } = await supabase
                .from('juvenis')
                .select('id, nome')
                .eq('status', 'ativo')
                .order('nome')

            setJuvenisDisponiveis(juvenisData || [])
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    function toggleJuvenil(id: string) {
        if (juvenisSelecionados.includes(id)) {
            setJuvenisSelecionados(juvenisSelecionados.filter(j => j !== id))
        } else {
            setJuvenisSelecionados([...juvenisSelecionados, id])
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErro('')

        if (parentesco === 'outro' && !parentescoOutro.trim()) {
            setErro('Especifique o parentesco no campo "Outro"')
            return
        }

        setSalvando(true)

        try {
            const senhaInicial = 'rede123'

            const response = await fetch('/api/criar-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    senha: senhaInicial,
                    nome: nome.trim(),
                    role: 'pai',
                    telefone: telefone.trim() || null
                })
            })

            const resultado = await response.json()

            if (!response.ok) {
                throw new Error(resultado.error || 'Erro ao criar usuário')
            }

            const { data: paiCriado, error: erroPai } = await supabase
                .from('pais')
                .insert({
                    profile_id: resultado.user.id,
                    nome: nome.trim(),
                    telefone: telefone.trim() || null,
                    whatsapp: whatsapp.trim() || null,
                    email: email.trim(),
                    parentesco: parentesco,
                    parentesco_outro: parentesco === 'outro' ? parentescoOutro.trim() : null,
                    status: 'ativo'
                })
                .select()
                .single()

            if (erroPai) throw erroPai

            if (juvenisSelecionados.length > 0) {
                const vinculos = juvenisSelecionados.map(juvenilId => ({
                    pai_id: paiCriado.id,
                    juvenil_id: juvenilId
                }))

                const { error: erroVinculo } = await supabase
                    .from('pai_juvenil')
                    .insert(vinculos)

                if (erroVinculo) throw erroVinculo
            }

            setSucesso({
                email: email.trim(),
                senha: senhaInicial,
                nome: nome.trim()
            })

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
                                    <strong>{sucesso.nome}</strong> foi adicionado(a) como responsável
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
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
                                        <p className="text-sm font-mono text-purple-600 break-all">https://rede-juvenil.vercel.app/login</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ <strong>Importante:</strong> Compartilhe essas credenciais com {sucesso.nome} e oriente-o(a) a trocar a senha após o primeiro acesso.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <button onClick={copiarCredenciais} className="bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2">
                                    📋 Copiar Credenciais
                                </button>
                                <button onClick={enviarWhatsApp} className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                                    💬 Enviar por WhatsApp
                                </button>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <Link href="/pais" className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition">
                                    Ver Lista de Responsáveis
                                </Link>
                                <button
                                    onClick={() => {
                                        setSucesso(null)
                                        setNome('')
                                        setEmail('')
                                        setTelefone('')
                                        setWhatsapp('')
                                        setParentesco('responsavel')
                                        setParentescoOutro('')
                                        setJuvenisSelecionados([])
                                    }}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition"
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
                    <Link href="/pais" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Responsável
                    </h1>
                    <p className="text-gray-600 mt-1">
                        O sistema criará automaticamente o login de acesso
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 lg:p-8 max-w-2xl">
                    <div className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                                placeholder="Ex: Ana Silva Santos"
                                disabled={salvando}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email para Login <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                                placeholder="ana@email.com"
                                disabled={salvando}
                            />
                            <p className="text-xs text-purple-600 mt-1">
                                🔐 Será criado login automático com senha inicial &quot;rede123&quot;
                            </p>
                        </div>

                        {/* Parentesco */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Parentesco <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={parentesco}
                                onChange={(e) => setParentesco(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                                disabled={salvando}
                            >
                                {OPCOES_PARENTESCO.map(opcao => (
                                    <option key={opcao.valor} value={opcao.valor}>
                                        {opcao.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Campo Outro (aparece se selecionar "outro") */}
                        {parentesco === 'outro' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Especifique o parentesco <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={parentescoOutro}
                                    onChange={(e) => setParentescoOutro(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                                    placeholder="Ex: Primo, Madrinha, Amigo da família..."
                                    disabled={salvando}
                                    maxLength={100}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                                    placeholder="(51) 3000-0000"
                                    disabled={salvando}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                                    placeholder="(51) 99999-9999"
                                    disabled={salvando}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Vincular Filho(s) do Ministério
                            </label>
                            {juvenisDisponiveis.length === 0 ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                                    Nenhum juvenil cadastrado ainda.
                                    <br />
                                    <Link href="/juvenis/novo" className="text-blue-600 hover:underline">
                                        Cadastre um juvenil primeiro
                                    </Link>
                                </div>
                            ) : (
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                    {juvenisDisponiveis.map((juvenil) => (
                                        <label 
                                            key={juvenil.id} 
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={juvenisSelecionados.includes(juvenil.id)}
                                                onChange={() => toggleJuvenil(juvenil.id)}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                disabled={salvando}
                                            />
                                            <span className="text-gray-800">🧒 {juvenil.nome}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link href="/pais" className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Cadastrando...' : '💾 Cadastrar + Criar Login'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}