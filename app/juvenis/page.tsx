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

interface Juvenil {
    id: string
    nome: string
    data_nascimento: string
    foto_url: string | null
    alergias: string | null
    observacoes: string | null
    data_entrada: string
    status: string
    created_at: string
}

export default function JuvenisPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [juvenis, setJuvenis] = useState<Juvenil[]>([])
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
            await buscarJuvenis()
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function buscarJuvenis() {
        try {
            const { data, error } = await supabase
                .from('juvenis')
                .select('*')
                .order('nome', { ascending: true })

            if (error) throw error
            setJuvenis(data || [])
        } catch (error) {
            console.error('Erro ao buscar juvenis:', error)
        }
    }

    async function excluirJuvenil(id: string, nome: string) {
        if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return

        try {
            const { error } = await supabase
                .from('juvenis')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert('Juvenil excluído com sucesso!')
            await buscarJuvenis()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir juvenil')
        }
    }

    function calcularIdade(dataNasc: string) {
        const hoje = new Date()
        const nasc = new Date(dataNasc)
        let idade = hoje.getFullYear() - nasc.getFullYear()
        const mes = hoje.getMonth() - nasc.getMonth()
        if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
            idade--
        }
        return idade
    }

    function formatarData(data: string) {
        return new Date(data).toLocaleDateString('pt-BR')
    }

    // Filtrar juvenis pela busca
    const juvenisFiltrados = juvenis.filter(j => 
        j.nome.toLowerCase().includes(busca.toLowerCase())
    )

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">⏳</div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
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
                                🧒 Juvenis
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Total: {juvenis.length} cadastrado(s)
                            </p>
                        </div>
                        
                        {perfil.role === 'lider' && (
                            <Link
                                href="/juvenis/novo"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>➕</span>
                                Novo Juvenil
                            </Link>
                        )}
                    </div>
                </div>

                {/* Busca */}
                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="🔍 Buscar por nome..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                        />
                    </div>
                </div>

                {/* Lista de Juvenis */}
                {juvenisFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">🧒</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {busca ? 'Nenhum juvenil encontrado' : 'Nenhum juvenil cadastrado'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {busca 
                                ? 'Tente buscar com outro nome' 
                                : 'Comece cadastrando o primeiro juvenil do ministério!'
                            }
                        </p>
                        {perfil.role === 'lider' && !busca && (
                            <Link
                                href="/juvenis/novo"
                                className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition"
                            >
                                ➕ Cadastrar Primeiro Juvenil
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {juvenisFiltrados.map((juvenil) => (
                            <div 
                                key={juvenil.id} 
                                className="bg-white rounded-2xl shadow hover:shadow-lg transition p-6"
                            >
                                {/* Avatar */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-3xl text-white shadow-md">
                                        {juvenil.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight">
                                            {juvenil.nome}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {calcularIdade(juvenil.data_nascimento)} anos
                                        </p>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <span>🎂</span>
                                        <span>{formatarData(juvenil.data_nascimento)}</span>
                                    </div>
                                    
                                    {juvenil.alergias && (
                                        <div className="flex items-start gap-2 text-orange-600 bg-orange-50 p-2 rounded-lg">
                                            <span>⚠️</span>
                                            <span className="text-xs">
                                                <strong>Alergias:</strong> {juvenil.alergias}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            juvenil.status === 'ativo' 
                                                ? 'bg-green-100 text-green-700'
                                                : juvenil.status === 'formado'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {juvenil.status === 'ativo' && '✅ Ativo'}
                                            {juvenil.status === 'inativo' && '⏸️ Inativo'}
                                            {juvenil.status === 'formado' && '🎓 Formado'}
                                        </span>
                                    </div>
                                </div>

                                {/* Ações (só líder) */}
                                {perfil.role === 'lider' && (
                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => alert('Em breve: editar')}
                                            className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => excluirJuvenil(juvenil.id, juvenil.nome)}
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

                {/* Rodapé */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    🙏 Rede Juvenil © 2025
                </p>
            </main>
        </div>
    )
}