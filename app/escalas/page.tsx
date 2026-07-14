'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    profile_id: string | null
}

interface Pai {
    id: string
    nome: string
    profile_id: string | null
}

interface EscalaMinistro {
    id: string
    culto_id: string
    ministro_id: string
    status: string
    ministros: Ministro
}

interface EscalaLanche {
    id: string
    culto_id: string
    pai_id: string
    status: string
    observacoes: string | null
    pais: Pai
}

interface Culto {
    id: string
    data: string
    dia_semana: string
    tema: string | null
    fonte: string
    status: string
    escala_ministros: EscalaMinistro[]
    escala_lanches: EscalaLanche[]
}

export default function EscalasPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [meuMinistroId, setMeuMinistroId] = useState<string | null>(null)
    const [meuPaiId, setMeuPaiId] = useState<string | null>(null)
    const [cultos, setCultos] = useState<Culto[]>([])
    const [ministrosDisponiveis, setMinistrosDisponiveis] = useState<Ministro[]>([])
    const [paisDisponiveis, setPaisDisponiveis] = useState<Pai[]>([])
    const [carregando, setCarregando] = useState(true)
    const [filtroMes, setFiltroMes] = useState<string>('todos')
    const [modalMinistros, setModalMinistros] = useState<string | null>(null)
    const [modalLanche, setModalLanche] = useState<string | null>(null)

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

            // Se for ministro, pegar o ID do ministro dele
            if (perfilData.role === 'ministro') {
                const { data: ministroData } = await supabase
                    .from('ministros')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single()
                if (ministroData) setMeuMinistroId(ministroData.id)
            }

            // Se for pai, pegar o ID do pai dele
            if (perfilData.role === 'pai') {
                const { data: paiData } = await supabase
                    .from('pais')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single()
                if (paiData) setMeuPaiId(paiData.id)
            }

            await Promise.all([
                buscarCultos(),
                buscarMinistros(),
                buscarPais()
            ])
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
                .select(`
                    *,
                    escala_ministros(
                        id,
                        culto_id,
                        ministro_id,
                        status,
                        ministros(id, nome, profile_id)
                    ),
                    escala_lanches(
                        id,
                        culto_id,
                        pai_id,
                        status,
                        observacoes,
                        pais(id, nome, profile_id)
                    )
                `)
                .order('data', { ascending: true })

            if (error) throw error
            setCultos(data || [])
        } catch (error) {
            console.error('Erro ao buscar cultos:', error)
        }
    }

    async function buscarMinistros() {
        try {
            const { data } = await supabase
                .from('ministros')
                .select('id, nome, profile_id')
                .eq('status', 'ativo')
                .order('nome')
            setMinistrosDisponiveis(data || [])
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function buscarPais() {
        try {
            const { data } = await supabase
                .from('pais')
                .select('id, nome, profile_id')
                .eq('status', 'ativo')
                .order('nome')
            setPaisDisponiveis(data || [])
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    async function adicionarMinistroCulto(cultoId: string, ministroId: string) {
        try {
            const { error } = await supabase
                .from('escala_ministros')
                .insert({
                    culto_id: cultoId,
                    ministro_id: ministroId,
                    status: 'confirmado'
                })

            if (error) {
                if (error.code === '23505') {
                    alert('Este ministro já está escalado para este culto!')
                } else {
                    throw error
                }
                return
            }

            await buscarCultos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao adicionar ministro')
        }
    }

    async function removerMinistroCulto(escalaId: string, nome: string) {
        if (!confirm(`Remover ${nome} desta escala?`)) return

        try {
            const { error } = await supabase
                .from('escala_ministros')
                .delete()
                .eq('id', escalaId)

            if (error) throw error
            await buscarCultos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao remover')
        }
    }

    async function adicionarPaiLanche(cultoId: string, paiId: string) {
        try {
            const { error } = await supabase
                .from('escala_lanches')
                .insert({
                    culto_id: cultoId,
                    pai_id: paiId,
                    status: 'confirmado'
                })

            if (error) {
                if (error.code === '23505') {
                    alert('Este pai já está escalado para este culto!')
                } else {
                    throw error
                }
                return
            }

            await buscarCultos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao adicionar')
        }
    }

    async function removerPaiLanche(escalaId: string, nome: string) {
        if (!confirm(`Remover ${nome} do lanche?`)) return

        try {
            const { error } = await supabase
                .from('escala_lanches')
                .delete()
                .eq('id', escalaId)

            if (error) throw error
            await buscarCultos()
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao remover')
        }
    }

    async function meInscreverComoMinistro(cultoId: string) {
        if (!meuMinistroId) return
        await adicionarMinistroCulto(cultoId, meuMinistroId)
    }

    async function meInscreverComoLanche(cultoId: string) {
        if (!meuPaiId) return
        await adicionarPaiLanche(cultoId, meuPaiId)
    }

    function formatarData(data: string) {
        const [ano, mes, dia] = data.split('-')
        return `${dia}/${mes}/${ano}`
    }

    function ehPassado(data: string) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataCulto = new Date(data + 'T12:00:00')
        return dataCulto < hoje
    }

    function jaSouMinistroCulto(culto: Culto) {
        if (!meuMinistroId) return false
        return culto.escala_ministros.some(e => e.ministro_id === meuMinistroId)
    }

    function jaSouLancheCulto(culto: Culto) {
        if (!meuPaiId) return false
        return culto.escala_lanches.some(e => e.pai_id === meuPaiId)
    }

    // Filtro
    const cultosFiltrados = filtroMes === 'todos' 
        ? cultos 
        : cultos.filter(c => c.data.split('-')[1] === filtroMes)

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
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        📋 Escalas
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {perfil.role === 'lider' && '👑 Você pode gerenciar todas as escalas'}
                        {perfil.role === 'ministro' && '⛪ Se inscreva nos cultos que pode servir'}
                        {perfil.role === 'pai' && '🍰 Escolha um culto para levar lanche'}
                        {perfil.role === 'juvenil' && '👀 Visualização da escala'}
                    </p>
                </div>

                {/* Filtro por mês */}
                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Filtrar por mês:
                    </label>
                    <select
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
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
                        <p className="text-gray-600">
                            Cadastre cultos primeiro para criar as escalas!
                        </p>
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
                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></span>
                                        {nomeMes}
                                    </h2>
                                    <div className="space-y-4">
                                        {cultosPorMes[chave].map((culto) => (
                                            <div 
                                                key={culto.id} 
                                                className={`bg-white rounded-2xl shadow p-5 ${
                                                    ehPassado(culto.data) ? 'opacity-60' : ''
                                                }`}
                                            >
                                                {/* Header do culto */}
                                                <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-100">
                                                    <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-md flex-shrink-0 ${
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
                                                        <h3 className="font-bold text-gray-800 capitalize">
                                                            {culto.dia_semana} • {formatarData(culto.data)}
                                                        </h3>
                                                        {culto.tema && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                📖 {culto.tema}
                                                            </p>
                                                        )}
                                                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                                            culto.fonte === 'pense_laranja' 
                                                                ? 'bg-orange-100 text-orange-700' 
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {culto.fonte === 'pense_laranja' ? '🟠 Pense Laranja' : '🔵 Rede Interna'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Grid: Ministros | Lanche */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    
                                                    {/* MINISTROS */}
                                                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                                                <span>⛪</span>
                                                                Ministros
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded-full">
                                                                    {culto.escala_ministros.length}
                                                                </span>
                                                            </h4>
                                                        </div>

                                                        {culto.escala_ministros.length === 0 ? (
                                                            <p className="text-sm text-gray-500 italic mb-3">
                                                                Nenhum ministro inscrito
                                                            </p>
                                                        ) : (
                                                            <ul className="space-y-1 mb-3">
                                                                {culto.escala_ministros.map((esc) => (
                                                                    <li 
                                                                        key={esc.id}
                                                                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm"
                                                                    >
                                                                        <span className="text-gray-800 font-medium">
                                                                            👤 {esc.ministros.nome}
                                                                        </span>
                                                                        {(perfil.role === 'lider' || esc.ministros.profile_id === perfil.id) && !ehPassado(culto.data) && (
                                                                            <button
                                                                                onClick={() => removerMinistroCulto(esc.id, esc.ministros.nome)}
                                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {/* Botões */}
                                                        {!ehPassado(culto.data) && (
                                                            <div className="flex flex-col gap-2">
                                                                {perfil.role === 'ministro' && !jaSouMinistroCulto(culto) && (
                                                                    <button
                                                                        onClick={() => meInscreverComoMinistro(culto.id)}
                                                                        className="bg-purple-500 text-white text-sm py-2 rounded-lg font-semibold hover:bg-purple-600 transition"
                                                                    >
                                                                        ✅ Me inscrever
                                                                    </button>
                                                                )}
                                                                {perfil.role === 'lider' && (
                                                                    <button
                                                                        onClick={() => setModalMinistros(culto.id)}
                                                                        className="bg-white text-purple-600 text-sm py-2 rounded-lg font-semibold hover:bg-purple-50 transition border border-purple-200"
                                                                    >
                                                                        ➕ Adicionar Ministro
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* LANCHE */}
                                                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                                                <span>🍰</span>
                                                                Lanche
                                                                <span className="text-xs bg-white px-2 py-0.5 rounded-full">
                                                                    {culto.escala_lanches.length}
                                                                </span>
                                                            </h4>
                                                        </div>

                                                        {culto.escala_lanches.length === 0 ? (
                                                            <p className="text-sm text-gray-500 italic mb-3">
                                                                Nenhuma família confirmada
                                                            </p>
                                                        ) : (
                                                            <ul className="space-y-1 mb-3">
                                                                {culto.escala_lanches.map((esc) => (
                                                                    <li 
                                                                        key={esc.id}
                                                                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm"
                                                                    >
                                                                        <span className="text-gray-800 font-medium">
                                                                            🏠 Família {esc.pais.nome.split(' ')[0]}
                                                                        </span>
                                                                        {(perfil.role === 'lider' || esc.pais.profile_id === perfil.id) && !ehPassado(culto.data) && (
                                                                            <button
                                                                                onClick={() => removerPaiLanche(esc.id, esc.pais.nome)}
                                                                                className="text-red-500 hover:text-red-700 text-xs"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        {/* Botões */}
                                                        {!ehPassado(culto.data) && (
                                                            <div className="flex flex-col gap-2">
                                                                {perfil.role === 'pai' && !jaSouLancheCulto(culto) && (
                                                                    <button
                                                                        onClick={() => meInscreverComoLanche(culto.id)}
                                                                        className="bg-orange-500 text-white text-sm py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
                                                                    >
                                                                        🍰 Vou levar lanche
                                                                    </button>
                                                                )}
                                                                {perfil.role === 'lider' && (
                                                                    <button
                                                                        onClick={() => setModalLanche(culto.id)}
                                                                        className="bg-white text-orange-600 text-sm py-2 rounded-lg font-semibold hover:bg-orange-50 transition border border-orange-200"
                                                                    >
                                                                        ➕ Adicionar Família
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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

            {/* MODAL: Adicionar Ministro */}
            {modalMinistros && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">
                                ➕ Adicionar Ministro
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Clique em um ministro para escalar
                            </p>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {ministrosDisponiveis.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    Nenhum ministro cadastrado
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {ministrosDisponiveis.map((min) => {
                                        const jaEscalado = cultos
                                            .find(c => c.id === modalMinistros)
                                            ?.escala_ministros
                                            .some(e => e.ministro_id === min.id)
                                        
                                        return (
                                            <li key={min.id}>
                                                <button
                                                    onClick={async () => {
                                                        if (!jaEscalado) {
                                                            await adicionarMinistroCulto(modalMinistros, min.id)
                                                            setModalMinistros(null)
                                                        }
                                                    }}
                                                    disabled={jaEscalado}
                                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                                                        jaEscalado 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                                    }`}
                                                >
                                                    ⛪ {min.nome}
                                                    {jaEscalado && ' (já escalado)'}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => setModalMinistros(null)}
                                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Adicionar Família Lanche */}
            {modalLanche && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">
                                🍰 Adicionar Família
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Clique em uma família para escalar
                            </p>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {paisDisponiveis.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    Nenhum pai/mãe cadastrado
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {paisDisponiveis.map((pai) => {
                                        const jaEscalado = cultos
                                            .find(c => c.id === modalLanche)
                                            ?.escala_lanches
                                            .some(e => e.pai_id === pai.id)
                                        
                                        return (
                                            <li key={pai.id}>
                                                <button
                                                    onClick={async () => {
                                                        if (!jaEscalado) {
                                                            await adicionarPaiLanche(modalLanche, pai.id)
                                                            setModalLanche(null)
                                                        }
                                                    }}
                                                    disabled={jaEscalado}
                                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                                                        jaEscalado 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                    }`}
                                                >
                                                    👨‍👩‍👧 {pai.nome}
                                                    {jaEscalado && ' (já escalado)'}
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => setModalLanche(null)}
                                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}