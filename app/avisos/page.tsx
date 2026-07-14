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

interface Aviso {
    id: string
    titulo: string
    conteudo: string
    publico: string
    fixado: boolean
    ativo: boolean
    created_at: string
    updated_at: string
}

export default function AvisosPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [avisos, setAvisos] = useState<Aviso[]>([])
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

            if (!perfilData) {
                router.push('/login')
                return
            }

            setPerfil(perfilData)
            await buscarAvisos()
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function buscarAvisos() {
        try {
            const { data, error } = await supabase
                .from('avisos')
                .select('*')
                .eq('ativo', true)
                .order('fixado', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setAvisos(data || [])
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function excluirAviso(id: string, titulo: string) {
        if (!confirm(`Excluir aviso "${titulo}"?`)) return

        try {
            const { error } = await supabase
                .from('avisos')
                .delete()
                .eq('id', id)

            if (error) throw error
            alert('Aviso excluído!')
            await buscarAvisos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao excluir')
        }
    }

    async function toggleFixar(id: string, fixadoAtual: boolean) {
        try {
            const { error } = await supabase
                .from('avisos')
                .update({ fixado: !fixadoAtual })
                .eq('id', id)

            if (error) throw error
            await buscarAvisos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao atualizar')
        }
    }

    function formatarData(data: string) {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function corPublico(publico: string) {
        const cores: { [key: string]: string } = {
            ministros: 'bg-purple-100 text-purple-700 border-purple-300',
            pais: 'bg-orange-100 text-orange-700 border-orange-300',
            juvenis: 'bg-blue-100 text-blue-700 border-blue-300',
            todos: 'bg-green-100 text-green-700 border-green-300'
        }
        return cores[publico] || 'bg-gray-100 text-gray-700'
    }

    function iconePublico(publico: string) {
        const icones: { [key: string]: string } = {
            ministros: '⛪',
            pais: '👨‍👩‍👧',
            juvenis: '🧒',
            todos: '👥'
        }
        return icones[publico] || '👥'
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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                📣 Avisos
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {avisos.length} aviso(s) no mural
                            </p>
                        </div>
                        
                        {perfil.role === 'lider' && (
                            <Link
                                href="/avisos/novo"
                                className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>➕</span>
                                Novo Aviso
                            </Link>
                        )}
                    </div>
                </div>

                {avisos.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">📣</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            Nenhum aviso ainda
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {perfil.role === 'lider' 
                                ? 'Comece publicando o primeiro aviso!' 
                                : 'Nenhum aviso publicado no momento'
                            }
                        </p>
                        {perfil.role === 'lider' && (
                            <Link
                                href="/avisos/novo"
                                className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition"
                            >
                                ➕ Publicar Primeiro Aviso
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {avisos.map((aviso) => (
                            <div 
                                key={aviso.id} 
                                className={`bg-white rounded-2xl shadow p-6 border-l-4 ${
                                    aviso.fixado 
                                        ? 'border-yellow-500'
                                        : 'border-gray-200'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {aviso.fixado && (
                                                <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-semibold">
                                                    📌 Fixado
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold border ${corPublico(aviso.publico)}`}>
                                                {iconePublico(aviso.publico)} {aviso.publico === 'todos' ? 'Todos' : aviso.publico.charAt(0).toUpperCase() + aviso.publico.slice(1)}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">
                                            {aviso.titulo}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            📅 {formatarData(aviso.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Conteúdo */}
                                <div className="prose prose-sm max-w-none mb-4">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {aviso.conteudo}
                                    </p>
                                </div>

                                {/* Ações */}
                                {perfil.role === 'lider' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => toggleFixar(aviso.id, aviso.fixado)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                                                aviso.fixado
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {aviso.fixado ? '📌 Desafixar' : '📌 Fixar'}
                                        </button>
                                        <button
                                            onClick={() => excluirAviso(aviso.id, aviso.titulo)}
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