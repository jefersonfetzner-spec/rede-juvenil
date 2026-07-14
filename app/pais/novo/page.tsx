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

export default function NovoPaiPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [juvenisDisponiveis, setJuvenisDisponiveis] = useState<JuvenilOpcao[]>([])
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    // Campos
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [email, setEmail] = useState('')
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

            // Buscar juvenis para vincular
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
        setSalvando(true)

        try {
            // 1. Cadastrar o pai
            const { data: paiCriado, error: erroPai } = await supabase
                .from('pais')
                .insert({
                    nome: nome.trim(),
                    telefone: telefone.trim() || null,
                    whatsapp: whatsapp.trim() || null,
                    email: email.trim() || null,
                    status: 'ativo'
                })
                .select()
                .single()

            if (erroPai) throw erroPai

            // 2. Vincular aos filhos selecionados
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

            alert(`✅ ${nome} cadastrado(a) com sucesso!`)
            router.push('/pais')
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
                
                <div className="bg-white rounded-2xl shadow p-6 mb-6 mt-14 lg:mt-0">
                    <Link href="/pais" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Pai/Mãe
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Preencha os dados do responsável
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
                                placeholder="Ex: Ana Silva Santos"
                                disabled={salvando}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Telefone
                                </label>
                                <input
                                    type="tel"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
                                    placeholder="(51) 99999-9999"
                                    disabled={salvando}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
                                placeholder="email@exemplo.com"
                                disabled={salvando}
                            />
                        </div>

                        {/* Vincular filhos */}
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
                            <p className="text-xs text-gray-500 mt-1">
                                Marque os filhos que são deste responsável
                            </p>
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link
                                href="/pais"
                                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Salvando...' : '💾 Cadastrar'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}