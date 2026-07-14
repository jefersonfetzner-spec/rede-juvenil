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

export default function NovoCultoPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    // Campos
    const [data, setData] = useState('')
    const [diaSemana, setDiaSemana] = useState<'domingo' | 'quarta'>('domingo')
    const [tema, setTema] = useState('')
    const [fonte, setFonte] = useState<'pense_laranja' | 'interno'>('pense_laranja')
    const [observacoes, setObservacoes] = useState('')

    // Modo em lote
    const [modoLote, setModoLote] = useState(false)
    const [mesLote, setMesLote] = useState('')

    useEffect(() => {
        verificarUsuario()
    }, [])

    useEffect(() => {
        // Atualizar dia da semana automaticamente
        if (data) {
            const dia = new Date(data + 'T12:00:00').getDay()
            if (dia === 0) setDiaSemana('domingo')
            else if (dia === 3) setDiaSemana('quarta')
        }
    }, [data])

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
        } finally {
            setCarregando(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErro('')
        setSalvando(true)

        try {
            const dataObj = new Date(data + 'T12:00:00')
            const diaSemanaCorreto = dataObj.getDay()
            
            if (diaSemana === 'domingo' && diaSemanaCorreto !== 0) {
                throw new Error('A data selecionada não é um domingo!')
            }
            if (diaSemana === 'quarta' && diaSemanaCorreto !== 3) {
                throw new Error('A data selecionada não é uma quarta-feira!')
            }

            const { error } = await supabase
                .from('cultos')
                .insert({
                    data: data,
                    dia_semana: diaSemana,
                    tema: tema.trim() || null,
                    fonte: fonte,
                    observacoes: observacoes.trim() || null,
                    status: 'agendado'
                })

            if (error) throw error

            alert(`✅ Culto cadastrado com sucesso!`)
            router.push('/cultos')
        } catch (error: unknown) {
            const mensagem = error instanceof Error ? error.message : 'Erro ao cadastrar'
            setErro(mensagem)
            setSalvando(false)
        }
    }

    async function gerarCultosDoMes() {
        if (!mesLote) {
            setErro('Selecione o mês')
            return
        }

        setSalvando(true)
        setErro('')

        try {
            const [ano, mes] = mesLote.split('-').map(Number)
            const primeiroDia = new Date(ano, mes - 1, 1)
            const ultimoDia = new Date(ano, mes, 0)
            
            const cultosParaCriar: {
                data: string
                dia_semana: 'domingo' | 'quarta'
                fonte: 'pense_laranja' | 'interno'
                status: 'agendado'
            }[] = []

            for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
                const dataAtual = new Date(ano, mes - 1, dia)
                const diaDaSemana = dataAtual.getDay()

                if (diaDaSemana === 0) { // Domingo
                    cultosParaCriar.push({
                        data: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
                        dia_semana: 'domingo',
                        fonte: 'pense_laranja',
                        status: 'agendado'
                    })
                } else if (diaDaSemana === 3) { // Quarta
                    cultosParaCriar.push({
                        data: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
                        dia_semana: 'quarta',
                        fonte: 'interno',
                        status: 'agendado'
                    })
                }
            }

            if (cultosParaCriar.length === 0) {
                throw new Error('Nenhum domingo ou quarta encontrado')
            }

            const { error } = await supabase
                .from('cultos')
                .insert(cultosParaCriar)

            if (error) throw error

            alert(`✅ ${cultosParaCriar.length} cultos criados com sucesso!`)
            router.push('/cultos')
        } catch (error: unknown) {
            const mensagem = error instanceof Error ? error.message : 'Erro ao criar cultos'
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
                    <Link href="/cultos" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Culto
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Cadastre um culto ou gere todos de um mês
                    </p>
                </div>

                {/* Escolha do modo */}
                <div className="bg-white rounded-2xl shadow p-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setModoLote(false)}
                            className={`p-4 rounded-lg border-2 transition ${
                                !modoLote 
                                    ? 'border-green-500 bg-green-50 text-green-700' 
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-2xl mb-1">📝</div>
                            <p className="font-semibold text-sm">1 Culto</p>
                            <p className="text-xs opacity-75">Cadastro individual</p>
                        </button>
                        <button
                            onClick={() => setModoLote(true)}
                            className={`p-4 rounded-lg border-2 transition ${
                                modoLote 
                                    ? 'border-green-500 bg-green-50 text-green-700' 
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-2xl mb-1">📆</div>
                            <p className="font-semibold text-sm">Mês Inteiro</p>
                            <p className="text-xs opacity-75">Gerar automático</p>
                        </button>
                    </div>
                </div>

                {/* Formulário */}
                <div className="bg-white rounded-2xl shadow p-6 lg:p-8 max-w-2xl">
                    
                    {!modoLote ? (
                        // MODO INDIVIDUAL
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Data do Culto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={data}
                                    onChange={(e) => setData(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-800"
                                    disabled={salvando}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Escolha um domingo ou quarta-feira
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Dia da Semana <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                        diaSemana === 'domingo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="diaSemana"
                                            value="domingo"
                                            checked={diaSemana === 'domingo'}
                                            onChange={(e) => setDiaSemana(e.target.value as 'domingo')}
                                            className="sr-only"
                                            disabled={salvando}
                                        />
                                        <div className="text-2xl">☀️</div>
                                        <p className="font-semibold text-gray-800">Domingo</p>
                                    </label>
                                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                        diaSemana === 'quarta' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="diaSemana"
                                            value="quarta"
                                            checked={diaSemana === 'quarta'}
                                            onChange={(e) => setDiaSemana(e.target.value as 'quarta')}
                                            className="sr-only"
                                            disabled={salvando}
                                        />
                                        <div className="text-2xl">🌙</div>
                                        <p className="font-semibold text-gray-800">Quarta</p>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Fonte do Material <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                        fonte === 'pense_laranja' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="fonte"
                                            value="pense_laranja"
                                            checked={fonte === 'pense_laranja'}
                                            onChange={(e) => setFonte(e.target.value as 'pense_laranja')}
                                            className="sr-only"
                                            disabled={salvando}
                                        />
                                        <div className="text-2xl">🟠</div>
                                        <p className="font-semibold text-gray-800 text-sm">Pense Laranja</p>
                                    </label>
                                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                        fonte === 'interno' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="fonte"
                                            value="interno"
                                            checked={fonte === 'interno'}
                                            onChange={(e) => setFonte(e.target.value as 'interno')}
                                            className="sr-only"
                                            disabled={salvando}
                                        />
                                        <div className="text-2xl">🔵</div>
                                        <p className="font-semibold text-gray-800 text-sm">Rede Interna</p>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tema do Culto
                                </label>
                                <input
                                    type="text"
                                    value={tema}
                                    onChange={(e) => setTema(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-800"
                                    placeholder="Ex: A fé de Abraão"
                                    disabled={salvando}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Observações
                                </label>
                                <textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-800 resize-none"
                                    placeholder="Alguma observação sobre o culto..."
                                    disabled={salvando}
                                />
                            </div>

                            {erro && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    ⚠️ {erro}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Link
                                    href="/cultos"
                                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition disabled:opacity-50"
                                >
                                    {salvando ? '⏳ Salvando...' : '💾 Cadastrar Culto'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        // MODO LOTE
                        <div className="space-y-5">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Modo Mês Inteiro:</strong> Vai criar automaticamente 
                                    todos os cultos de DOMINGO (Pense Laranja) e QUARTA (Rede Interna) 
                                    do mês escolhido.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Escolha o mês <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="month"
                                    value={mesLote}
                                    onChange={(e) => setMesLote(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-800"
                                    disabled={salvando}
                                />
                            </div>

                            {erro && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    ⚠️ {erro}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Link
                                    href="/cultos"
                                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    onClick={gerarCultosDoMes}
                                    disabled={salvando}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition disabled:opacity-50"
                                >
                                    {salvando ? '⏳ Gerando...' : '🚀 Gerar Cultos do Mês'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}