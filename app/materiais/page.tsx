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

interface Material {
    id: string
    titulo: string
    descricao: string | null
    tipo: string
    publico: string
    arquivo_url: string | null
    link_externo: string | null
    conteudo: string | null
    ativo: boolean
    created_at: string
}

export default function MateriaisPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [materiais, setMateriais] = useState<Material[]>([])
    const [busca, setBusca] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('todos')
    const [filtroPublico, setFiltroPublico] = useState('todos')
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
            await buscarMateriais()
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function buscarMateriais() {
        try {
            const { data, error } = await supabase
                .from('materiais')
                .select('*')
                .eq('ativo', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setMateriais(data || [])
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function excluirMaterial(id: string, titulo: string) {
        if (!confirm(`Excluir "${titulo}"?`)) return

        try {
            const { error } = await supabase
                .from('materiais')
                .delete()
                .eq('id', id)

            if (error) throw error
            alert('Material excluído!')
            await buscarMateriais()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao excluir')
        }
    }

    function iconePorTipo(tipo: string) {
        const icones: { [key: string]: string } = {
            roteiro_culto: '📋',
            devocional_pais: '🙏',
            devocional_juvenis: '📖',
            material_extra_pais: '📚',
            material_extra_juvenis: '🎨',
            dinamica: '🎮',
            resumo_culto: '📝',
            outro: '📄'
        }
        return icones[tipo] || '📄'
    }

    function labelTipo(tipo: string) {
        const labels: { [key: string]: string } = {
            roteiro_culto: 'Roteiro de Culto',
            devocional_pais: 'Devocional (Pais)',
            devocional_juvenis: 'Devocional (Juvenis)',
            material_extra_pais: 'Extra (Pais)',
            material_extra_juvenis: 'Extra (Juvenis)',
            dinamica: 'Dinâmica',
            resumo_culto: 'Resumo do Culto',
            outro: 'Outro'
        }
        return labels[tipo] || tipo
    }

    function corPublico(publico: string) {
        const cores: { [key: string]: string } = {
            ministros: 'bg-purple-100 text-purple-700',
            pais: 'bg-orange-100 text-orange-700',
            juvenis: 'bg-blue-100 text-blue-700',
            todos: 'bg-green-100 text-green-700'
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

    // Filtrar materiais
    let materiaisFiltrados = materiais

    if (busca) {
        materiaisFiltrados = materiaisFiltrados.filter(m => 
            m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            m.descricao?.toLowerCase().includes(busca.toLowerCase())
        )
    }

    if (filtroTipo !== 'todos') {
        materiaisFiltrados = materiaisFiltrados.filter(m => m.tipo === filtroTipo)
    }

    if (filtroPublico !== 'todos') {
        materiaisFiltrados = materiaisFiltrados.filter(m => m.publico === filtroPublico)
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
                                📚 Materiais
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Total: {materiais.length} material(is) disponível(is)
                            </p>
                        </div>
                        
                        {perfil.role === 'lider' && (
                            <Link
                                href="/materiais/novo"
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>➕</span>
                                Novo Material
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                🔍 Buscar
                            </label>
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Nome do material..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                📁 Tipo
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
                            >
                                <option value="todos">Todos os tipos</option>
                                <option value="roteiro_culto">📋 Roteiro de Culto</option>
                                <option value="devocional_pais">🙏 Devocional Pais</option>
                                <option value="devocional_juvenis">📖 Devocional Juvenis</option>
                                <option value="material_extra_pais">📚 Extra Pais</option>
                                <option value="material_extra_juvenis">🎨 Extra Juvenis</option>
                                <option value="dinamica">🎮 Dinâmica</option>
                                <option value="resumo_culto">📝 Resumo</option>
                                <option value="outro">📄 Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                👥 Público
                            </label>
                            <select
                                value={filtroPublico}
                                onChange={(e) => setFiltroPublico(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 text-sm"
                            >
                                <option value="todos">Todos os públicos</option>
                                <option value="ministros">⛪ Ministros</option>
                                <option value="pais">👨‍👩‍👧 Pais</option>
                                <option value="juvenis">🧒 Juvenis</option>
                            </select>
                        </div>
                    </div>
                </div>

                {materiaisFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {busca || filtroTipo !== 'todos' || filtroPublico !== 'todos'
                                ? 'Nenhum material encontrado'
                                : 'Nenhum material cadastrado'
                            }
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {busca || filtroTipo !== 'todos' || filtroPublico !== 'todos'
                                ? 'Tente ajustar os filtros'
                                : 'Comece adicionando o primeiro material!'
                            }
                        </p>
                        {perfil.role === 'lider' && !busca && filtroTipo === 'todos' && filtroPublico === 'todos' && (
                            <Link
                                href="/materiais/novo"
                                className="inline-block bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-700 transition"
                            >
                                ➕ Adicionar Primeiro Material
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materiaisFiltrados.map((material) => (
                            <div 
                                key={material.id} 
                                className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6"
                            >
                                {/* Header */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="text-4xl flex-shrink-0">
                                        {iconePorTipo(material.tipo)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 leading-tight mb-1">
                                            {material.titulo}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {labelTipo(material.tipo)}
                                        </p>
                                    </div>
                                </div>

                                {/* Badge Público */}
                                <div className="mb-3">
                                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${corPublico(material.publico)}`}>
                                        {iconePublico(material.publico)} {material.publico === 'todos' ? 'Todos' : material.publico.charAt(0).toUpperCase() + material.publico.slice(1)}
                                    </span>
                                </div>

                                {/* Descrição */}
                                {material.descricao && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {material.descricao}
                                    </p>
                                )}

                                {/* Ações */}
                                <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                                    {material.arquivo_url && (
                                        <a
                                            href={material.arquivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-500 text-white text-center py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                                        >
                                            📥 Baixar Arquivo
                                        </a>
                                    )}
                                    {material.link_externo && (
                                        <a
                                            href={material.link_externo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-purple-500 text-white text-center py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 transition flex items-center justify-center gap-2"
                                        >
                                            🔗 Abrir Link
                                        </a>
                                    )}
                                    {material.conteudo && (
                                        <details className="text-sm">
                                            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-semibold py-2">
                                                📖 Ver Conteúdo
                                            </summary>
                                            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                                                {material.conteudo}
                                            </div>
                                        </details>
                                    )}
                                    {perfil.role === 'lider' && (
                                        <button
                                            onClick={() => excluirMaterial(material.id, material.titulo)}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            🗑️ Excluir
                                        </button>
                                    )}
                                </div>
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