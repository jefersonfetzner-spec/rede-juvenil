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

export default function NovoMaterialPage() {
    const router = useRouter()
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')

    // Campos
    const [titulo, setTitulo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [tipo, setTipo] = useState('roteiro_culto')
    const [publico, setPublico] = useState('todos')
    const [linkExterno, setLinkExterno] = useState('')
    const [conteudo, setConteudo] = useState('')

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

        if (!linkExterno.trim() && !conteudo.trim()) {
            setErro('Adicione pelo menos um: link externo OU conteúdo textual')
            return
        }

        setSalvando(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('materiais')
                .insert({
                    titulo: titulo.trim(),
                    descricao: descricao.trim() || null,
                    tipo: tipo,
                    publico: publico,
                    link_externo: linkExterno.trim() || null,
                    conteudo: conteudo.trim() || null,
                    ativo: true,
                    created_by: user?.id
                })

            if (error) throw error

            alert(`✅ Material "${titulo}" cadastrado com sucesso!`)
            router.push('/materiais')
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
                    <Link href="/materiais" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2">
                        ← Voltar
                    </Link>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        ➕ Novo Material
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Adicione roteiros, devocionais, links e conteúdos
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                                placeholder="Ex: Devocional Semana 1 - A Fé de Abraão"
                                disabled={salvando}
                            />
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Descrição Curta
                            </label>
                            <input
                                type="text"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                                placeholder="Breve descrição do material..."
                                disabled={salvando}
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tipo <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                                disabled={salvando}
                            >
                                <option value="roteiro_culto">📋 Roteiro de Culto</option>
                                <option value="devocional_pais">🙏 Devocional para Pais</option>
                                <option value="devocional_juvenis">📖 Devocional para Juvenis</option>
                                <option value="material_extra_pais">📚 Material Extra para Pais</option>
                                <option value="material_extra_juvenis">🎨 Material Extra para Juvenis</option>
                                <option value="dinamica">🎮 Dinâmica</option>
                                <option value="resumo_culto">📝 Resumo de Culto</option>
                                <option value="outro">📄 Outro</option>
                            </select>
                        </div>

                        {/* Público */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Público-Alvo <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: 'ministros', label: 'Ministros', icone: '⛪', cor: 'purple' },
                                    { value: 'pais', label: 'Pais', icone: '👨‍👩‍👧', cor: 'orange' },
                                    { value: 'juvenis', label: 'Juvenis', icone: '🧒', cor: 'blue' },
                                    { value: 'todos', label: 'Todos', icone: '👥', cor: 'green' },
                                ].map((opcao) => (
                                    <label
                                        key={opcao.value}
                                        className={`
                                            flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition
                                            ${publico === opcao.value 
                                                ? `border-${opcao.cor}-500 bg-${opcao.cor}-50` 
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
                                        <span className="text-2xl mb-1">{opcao.icone}</span>
                                        <span className="text-xs font-semibold text-gray-800">
                                            {opcao.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Link Externo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                🔗 Link Externo
                            </label>
                            <input
                                type="url"
                                value={linkExterno}
                                onChange={(e) => setLinkExterno(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800"
                                placeholder="https://drive.google.com/... ou https://youtube.com/..."
                                disabled={salvando}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Cole aqui links do Google Drive, YouTube, PDFs online, etc.
                            </p>
                        </div>

                        {/* Divisor OU */}
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="flex-1 border-t"></div>
                            <span className="text-xs font-semibold">OU</span>
                            <div className="flex-1 border-t"></div>
                        </div>

                        {/* Conteúdo Textual */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                📝 Conteúdo Textual
                            </label>
                            <textarea
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 resize-none"
                                placeholder="Digite aqui o texto completo do devocional, roteiro, versículo..."
                                disabled={salvando}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Para devocionais curtos ou versículos, digite direto aqui
                            </p>
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                ⚠️ {erro}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Link
                                href="/materiais"
                                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 rounded-lg font-semibold text-center transition"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={salvando}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-700 transition disabled:opacity-50"
                            >
                                {salvando ? '⏳ Salvando...' : '💾 Cadastrar Material'}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}