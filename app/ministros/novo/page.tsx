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

export default function NovoMinistroPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    // Campos
    const [nome, setNome] = useState('')
    const [telefone, setTelefone] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [disponibilidade, setDisponibilidade] = useState<'domingo' | 'quarta' | 'ambos'>('ambos')
    const [funcao, setFuncao] = useState('ministro')

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
            const { error } = await supabase
                .from('ministros')
                .insert({
                    nome: nome.trim(),
                    telefone: telefone.trim() || null,
                    whatsapp: whatsapp.trim() || null,
                    disponibilidade: disponibilidade,
                    funcao: funcao,
                    status: 'ativo'
                })

            if (error) throw error

            alert(`✅ ${nome} adicionado(a) à equipe!`)
            router.push('/ministros')
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
                    <Link href="/ministros" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Ministro
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Adicione um membro à equipe de ministração
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
                                placeholder="Ex: Pedro Souza"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
                                    placeholder="(51) 99999-9999"
                                    disabled={salvando}
                                />
                            </div>
                        </div>

                        {/* Disponibilidade */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Disponibilidade <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { value: 'domingo', label: '☀️ Domingos', desc: 'Só domingo' },
                                    { value: 'quarta', label: '🌙 Quartas', desc: 'Só quarta' },
                                    { value: 'ambos', label: '✨ Ambos', desc: 'Dom e quartas' },
                                ].map((opcao) => (
                                    <label
                                        key={opcao.value}
                                        className={`
                                            relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition
                                            ${disponibilidade === opcao.value 
                                                ? 'border-pink-500 bg-pink-50' 
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="disponibilidade"
                                            value={opcao.value}
                                            checked={disponibilidade === opcao.value}
                                            onChange={(e) => setDisponibilidade(e.target.value as 'domingo' | 'quarta' | 'ambos')}
                                            className="sr-only"
                                            disabled={salvando}
                                        />
                                        <span className="text-2xl mb-1">{opcao.label.split(' ')[0]}</span>
                                        <span className="font-semibold text-gray-800 text-sm">
                                            {opcao.label.split(' ').slice(1).join(' ')}
                                        </span>
                                        <span className="text-xs text-gray-500">{opcao.desc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Função */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Função Principal
                            </label>
                            <select
                                value={funcao}
                                onChange={(e) => setFuncao(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
                                disabled={salvando}
                            >
                                <option value="ministro">Ministro Principal</option>
                                <option value="auxiliar">Auxiliar</option>
                                <option value="louvor">Louvor</option>
                                <option value="recepcao">Recepção</option>
                                <option value="dinamica">Dinâmicas</option>
                            </select>
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link
                                href="/ministros"
                                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Salvando...' : '💾 Cadastrar Ministro'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}