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

interface Culto {
    id: string
    data: string
    dia_semana: string
    tema: string | null
    fonte: string
    observacoes: string | null
    status: string
    created_at: string
}

export default function CultosPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [cultos, setCultos] = useState<Culto[]>([])
    const [filtroMes, setFiltroMes] = useState<string>('todos')
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
            await buscarCultos()
        } catch (error) {
            console.error('Erro:', error)
        } finally {
            setCarregando(false)
        }
    }

    async function buscarCultos() {
        try {
            const { data, error } = await supabase
                .from('cultos')
                .select('*')
                .order('data', { ascending: true })

            if (error) throw error
            setCultos(data || [])
        } catch (error) {
            console.error('Erro ao buscar cultos:', error)
        }
    }

    async function excluirCulto(id: string, data: string) {
        if (!confirm(`Tem certeza que deseja excluir o culto de ${formatarData(data)}?`)) return

        try {
            const { error } = await supabase
                .from('cultos')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert('Culto excluído com sucesso!')
            await buscarCultos()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir culto')
        }
    }

    async function marcarRealizado(id: string) {
        try {
            const { error } = await supabase
                .from('cultos')
                .update({ status: 'realizado' })
                .eq('id', id)

            if (error) throw error
            await buscarCultos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao atualizar')
        }
    }

    function formatarData(data: string) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
    }

    function formatarDataCompleta(data: string) {
        const dataObj = new Date(data + 'T12:00:00')
        return dataObj.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    function ehPassado(data: string) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataCulto = new Date(data + 'T12:00:00')
        return dataCulto < hoje
    }

    function ehHoje(data: string) {
        const hoje = new Date().toISOString().split('T')[0]
        return data === hoje
    }

    // Filtro por mês
    const cultosFiltrados = filtroMes === 'todos' 
        ? cultos 
        : cultos.filter(c => {
            const mes = c.data.split('-')[1]
            return mes === filtroMes
        })

    // Agrupar por mês
    const cultosPorMes: { [key: string]: Culto[] } = {}
    cultosFiltrados.forEach(culto => {
        const [ano, mes] = culto.data.split('-')
        const chave = `${ano}-${mes}`
        if (!cultosPorMes[chave]) cultosPorMes[chave] = []
        cultosPorMes[chave].push(culto)
    })

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-6xl animate-bounce">⏳</div>
            </div>
        )
    }

    if (!perfil) return null

    const meses = [
        { valor: 'todos', label: '📅 Todos' },
        { valor: '01', label: 'Janeiro' },
        { valor: '02', label: 'Fevereiro' },
        { valor: '03', label: 'Março' },
        { valor: '04', label: 'Abril' },
        { valor: '05', label: 'Maio' },
        { valor: '06', label: 'Junho' },
        { valor: '07', label: 'Julho' },
        { valor: '08', label: 'Agosto' },
        { valor: '09', label: 'Setembro' },
        { valor: '10', label: 'Outubro' },
        { valor: '11', label: 'Novembro' },
        { valor: '12', label: 'Dezembro' },
    ]

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
                                📅 Cultos
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Total: {cultos.length} culto(s) cadastrado(s)
                            </p>
                        </div>
                        
                        {perfil.role === 'lider' && (
                            <Link
                                href="/cultos/novo"
                                className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>➕</span>
                                Novo Culto
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filtro por mês */}
                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Filtrar por mês:
                    </label>
                    <select
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-800"
                    >
                        {meses.map(m => (
                            <option key={m.valor} value={m.valor}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {cultosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow p-12 text-center">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            Nenhum culto cadastrado
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Comece cadastrando os cultos do mês!
                        </p>
                        {perfil.role === 'lider' && (
                            <Link
                                href="/cultos/novo"
                                className="inline-block bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition"
                            >
                                ➕ Cadastrar Primeiro Culto
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.keys(cultosPorMes).sort().map(chave => {
                            const [ano, mes] = chave.split('-')
                            const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1)
                                .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                            
                            return (
                                <div key={chave}>
                                    <h2 className="text-lg font-bold text-gray-700 mb-3 capitalize flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-green-500 to-teal-500 rounded"></span>
                                        {nomeMes}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cultosPorMes[chave].map((culto) => (
                                            <div 
                                                key={culto.id} 
                                                className={`bg-white rounded-2xl shadow hover:shadow-lg transition p-5 relative overflow-hidden ${
                                                    ehHoje(culto.data) ? 'ring-2 ring-yellow-400' : ''
                                                }`}
                                            >
                                                {/* Badge HOJE */}
                                                {ehHoje(culto.data) && (
                                                    <div className="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                        HOJE
                                                    </div>
                                                )}

                                                {/* Data grande */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-md ${
                                                        culto.dia_semana === 'domingo' 
                                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                                            : 'bg-gradient-to-br from-orange-500 to-orange-600'
                                                    }`}>
                                                        <span className="text-2xl font-bold leading-none">
                                                            {culto.data.split('-')[2]}
                                                        </span>
                                                        <span className="text-xs uppercase">
                                                            {new Date(culto.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 capitalize">
                                                            {culto.dia_semana}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatarDataCompleta(culto.data)}
                                                        </p>
                                                        <div className="mt-1">
                                                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                culto.fonte === 'pense_laranja' 
                                                                    ? 'bg-orange-100 text-orange-700' 
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {culto.fonte === 'pense_laranja' ? '🟠 Pense Laranja' : '🔵 Rede Interna'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tema */}
                                                {culto.tema && (
                                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                                        <p className="text-xs text-gray-500 uppercase font-semibold">Tema</p>
                                                        <p className="text-sm text-gray-800 font-medium">{culto.tema}</p>
                                                    </div>
                                                )}

                                                {/* Observações */}
                                                {culto.observacoes && (
                                                    <p className="text-xs text-gray-600 mb-3 italic">
                                                        💬 {culto.observacoes}
                                                    </p>
                                                )}

                                                {/* Status */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        culto.status === 'agendado' 
                                                            ? ehPassado(culto.data) 
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-green-100 text-green-700'
                                                            : culto.status === 'realizado'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {culto.status === 'agendado' && ehPassado(culto.data) && '⚠️ Passou'}
                                                        {culto.status === 'agendado' && !ehPassado(culto.data) && '📌 Agendado'}
                                                        {culto.status === 'realizado' && '✅ Realizado'}
                                                        {culto.status === 'cancelado' && '❌ Cancelado'}
                                                    </span>
                                                </div>

                                                {/* Ações */}
                                                {perfil.role === 'lider' && (
                                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                                        {culto.status === 'agendado' && ehPassado(culto.data) && (
                                                            <button
                                                                onClick={() => marcarRealizado(culto.id)}
                                                                className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-xs font-semibold transition"
                                                            >
                                                                ✅ Marcar Realizado
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => excluirCulto(culto.id, culto.data)}
                                                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            🗑️ Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <p className="text-center text-gray-500 text-sm mt-8">
                    🙏 Rede Juvenil © 2025
                </p>
            </main>
        </div>
    )
}