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

interface Pai {
    id: string
    nome: string
    telefone: string | null
    whatsapp: string | null
    email: string | null
    parentesco: string
    parentesco_outro: string | null
    status: string
    created_at: string
}

const LABELS_PARENTESCO: { [key: string]: string } = {
    pai: '👨 Pai',
    mae: '👩 Mãe',
    avo: '👴 Avô',
    avoh: '👵 Avó',
    tio: '🧔 Tio',
    tia: '👩‍🦰 Tia',
    padrasto: '👨 Padrasto',
    madrasta: '👩 Madrasta',
    tutor: '⚖️ Tutor',
    responsavel: '🤝 Responsável',
    outro: '➕ Outro'
}

export default function PaisPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [pais, setPais] = useState<Pai[]>([])
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
            await buscarPais()
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function buscarPais() {
        try {
            const { data, error } = await supabase
                .from('pais')
                .select('*')
                .order('nome', { ascending: true })

            if (error) throw error
            setPais(data || [])
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function excluirPai(id: string, nome: string) {
        if (!confirm(`Excluir "${nome}"?`)) return

        try {
            const { error } = await supabase.from('pais').delete().eq('id', id)
            if (error) throw error
            alert('Responsável excluído com sucesso!')
            await buscarPais()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao excluir')
        }
    }

    function formatarParentesco(pai: Pai) {
        if (pai.parentesco === 'outro' && pai.parentesco_outro) {
            return `➕ ${pai.parentesco_outro}`
        }
        return LABELS_PARENTESCO[pai.parentesco] || '🤝 Responsável'
    }

    const paisFiltrados = pais.filter(p => 
        p.nome.toLowerCase().includes(busca.toLowerCase())
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
                                👨‍👩‍👧 Pais/Responsáveis
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Total: {pais.length} cadastrado(s)
                            </p>
                        </div>
                        
                        {perfil.role === 'lider' && (
                            <Link
                                href="/pais/novo"
                                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>➕</span>
                                Novo Responsável
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-800"
                    />
                </div>

                {paisFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">👨‍👩‍👧</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {busca ? 'Nenhum responsável encontrado' : 'Nenhum responsável cadastrado'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {busca ? 'Tente buscar com outro nome' : 'Comece cadastrando o primeiro responsável!'}
                        </p>
                        {perfil.role === 'lider' && !busca && (
                            <Link
                                href="/pais/novo"
                                className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition"
                            >
                                ➕ Cadastrar Primeiro Responsável
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paisFiltrados.map((pai) => (
                            <div 
                                key={pai.id} 
                                className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-3xl text-white shadow-md">
                                        {pai.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">
                                            {pai.nome}
                                        </h3>
                                        <p className="text-sm font-medium text-purple-600 mt-1">
                                            {formatarParentesco(pai)}
                                        </p>
                                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                                            pai.status === 'ativo' 
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {pai.status === 'ativo' ? '✅ Ativo' : '⏸️ Inativo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 text-sm">
                                    {pai.telefone && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <span>📞</span>
                                            <span>{pai.telefone}</span>
                                        </div>
                                    )}
                                    {pai.whatsapp && (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <span>💬</span>
                                            <a 
                                                href={`https://wa.me/55${pai.whatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {pai.whatsapp}
                                            </a>
                                        </div>
                                    )}
                                    {pai.email && (
                                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                                            <span>✉️</span>
                                            <span className="truncate">{pai.email}</span>
                                        </div>
                                    )}
                                </div>

                                {perfil.role === 'lider' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => alert('Em breve: editar')}
                                            className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => excluirPai(pai.id, pai.nome)}
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