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

export default function NovoAvisoPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    // Campos
    const [titulo, setTitulo] = useState('')
    const [conteudo, setConteudo] = useState('')
    const [publico, setPublico] = useState('todos')
    const [fixado, setFixado] = useState(false)

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
        } finally {
            setCarregando(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErro('')
        setSalvando(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('avisos')
                .insert({
                    titulo: titulo.trim(),
                    conteudo: conteudo.trim(),
                    publico: publico,
                    fixado: fixado,
                    ativo: true,
                    created_by: user?.id
                })

            if (error) throw error

            alert(`✅ Aviso publicado com sucesso!`)
            router.push('/avisos')
        } catch (error: unknown) {
            const mensagem = error instanceof Error ? error.message : 'Erro ao publicar'
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
                    <Link href="/avisos" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Aviso
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Publique um comunicado no mural
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 lg:p-8 max-w-3xl">
                    
                    <div className="space-y-5">
                        
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Título <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-800"
                                placeholder="Ex: Reunião de pais no próximo domingo"
                                disabled={salvando}
                            />
                        </div>

                        {/* Conteúdo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Conteúdo do Aviso <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-800 resize-none"
                                placeholder="Escreva aqui o conteúdo completo do aviso..."
                                disabled={salvando}
                            />
                        </div>

                        {/* Público */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Para quem é este aviso? <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: 'todos', label: 'Todos', icone: '👥' },
                                    { value: 'ministros', label: 'Ministros', icone: '⛪' },
                                    { value: 'pais', label: 'Pais', icone: '👨‍👩‍👧' },
                                    { value: 'juvenis', label: 'Juvenis', icone: '🧒' },
                                ].map((opcao) => (
                                    <label
                                        key={opcao.value}
                                        className={`
                                            flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition
                                            ${publico === opcao.value 
                                                ? 'border-red-500 bg-red-50' 
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="publico"
                                            value={opcao.value}
                                            checked={publico === opcao.value}
                                            onChange={(e) => setPublico(e.target.value)}
                                            className="sr-only"
                                            disabled={salvando}
                                        />
                                        <span className="text-3xl mb-1">{opcao.icone}</span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {opcao.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Fixar */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={fixado}
                                    onChange={(e) => setFixado(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 text-yellow-600 rounded focus:ring-yellow-500"
                                    disabled={salvando}
                                />
                                <div>
                                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                                        📌 Fixar no topo do mural
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Avisos fixados aparecem primeiro na lista
                                    </p>
                                </div>
                            </label>
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link
                                href="/avisos"
                                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Publicando...' : '📢 Publicar Aviso'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}