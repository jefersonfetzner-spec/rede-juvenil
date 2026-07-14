'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Perfil {
    id: string
    nome: string
    email: string
    role: string
}

interface Ministro {
    id: string
    nome: string
    telefone: string | null
    whatsapp: string | null
    disponibilidade: string
    funcao: string
    status: string
    created_at: string
}

export default function MinistrosPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [ministros, setMinistros] = useState<Ministro[]>([])
    const [busca, setBusca] = useState('')
    const [carregando, setCarregando] = useState(true)

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

            if (!perfilData || (perfilData.role !== 'lider' && perfilData.role !== 'ministro')) {
                router.push('/login')
                return
            }

            setPerfil(perfilData)
            await buscarMinistros()
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function buscarMinistros() {
        try {
            const { data, error } = await supabase
                .from('ministros')
                .select('*')
                .order('nome', { ascending: true })

            if (error) throw error
            setMinistros(data || [])
        } catch (error) {
            console.error('Erro ao buscar ministros:', error)
        }
    }

    async function excluirMinistro(id: string, nome: string) {
        if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return

        try {
            const { error } = await supabase
                .from('ministros')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert('Ministro excluído com sucesso!')
            await buscarMinistros()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir')
        }
    }

    function corDisponibilidade(disp: string) {
        switch (disp) {
            case 'domingo': return 'bg-blue-100 text-blue-700'
            case 'quarta': return 'bg-orange-100 text-orange-700'
            case 'ambos': return 'bg-green-100 text-green-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    function labelDisponibilidade(disp: string) {
        switch (disp) {
            case 'domingo': return '☀️ Domingos'
            case 'quarta': return '🌙 Quartas'
            case 'ambos': return '✨ Ambos'
            default: return disp
        }
    }

    const ministrosFiltrados = ministros.filter(m => 
        m.nome.toLowerCase().includes(busca.toLowerCase())
    )

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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                ⛪ Ministros
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Total: {ministros.length} na equipe
                            </p>
                        </div>
                        
                        {perfil.role === 'lider' && (
                            <Link
                                href="/ministros/novo"
                                className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>➕</span>
                                Novo Ministro
                            </Link>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="🔍 Buscar por nome..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-gray-800"
                    />
                </div>

                {ministrosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">⛪</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {busca ? 'Nenhum ministro encontrado' : 'Nenhum ministro cadastrado'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {busca 
                                ? 'Tente buscar com outro nome' 
                                : 'Comece adicionando os ministros da sua equipe!'
                            }
                        </p>
                        {perfil.role === 'lider' && !busca && (
                            <Link
                                href="/ministros/novo"
                                className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 transition"
                            >
                                ➕ Adicionar Primeiro Ministro
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ministrosFiltrados.map((ministro) => (
                            <div 
                                key={ministro.id} 
                                className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-3xl text-white shadow-md">
                                        {ministro.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">
                                            {ministro.nome}
                                        </h3>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {ministro.funcao}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {/* Disponibilidade */}
                                    <div>
                                        <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${corDisponibilidade(ministro.disponibilidade)}`}>
                                            {labelDisponibilidade(ministro.disponibilidade)}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                                            ministro.status === 'ativo' 
                                                ? 'bg-green-100 text-green-700'
                                                : ministro.status === 'afastado'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {ministro.status === 'ativo' && '✅ Ativo'}
                                            {ministro.status === 'inativo' && '⏸️ Inativo'}
                                            {ministro.status === 'afastado' && '⏳ Afastado'}
                                        </span>
                                    </div>

                                    {/* Contatos */}
                                    {ministro.telefone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                                            <span>📞</span>
                                            <span>{ministro.telefone}</span>
                                        </div>
                                    )}
                                    {ministro.whatsapp && (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <span>💬</span>
                                            <a 
                                                href={`https://wa.me/55${ministro.whatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {ministro.whatsapp}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {perfil.role === 'lider' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => alert('Em breve: editar')}
                                            className="flex-1 bg-pink-50 text-pink-600 hover:bg-pink-100 py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => excluirMinistro(ministro.id, ministro.nome)}
                                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            🗑️ Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-center text-gray-500 text-sm mt-8">
                    🙏 Rede Juvenil © 2025
                </p>
            </main>
        </div>
    )
}