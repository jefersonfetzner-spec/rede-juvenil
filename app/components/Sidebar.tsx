'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

interface SidebarProps {
    nomeUsuario: string
    emailUsuario: string
    roleUsuario: string
}

export default function Sidebar({ nomeUsuario, emailUsuario, roleUsuario }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [menuAberto, setMenuAberto] = useState(false)

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Menu baseado no ROLE do usuário
    function getMenuItems() {
        // LÍDER - vê TUDO
        if (roleUsuario === 'lider') {
            return [
                { href: '/dashboard', icone: '🏠', titulo: 'Dashboard' },
                { href: '/juvenis', icone: '🧒', titulo: 'Juvenis' },
                { href: '/pais', icone: '👨‍👩‍👧', titulo: 'Pais/Responsáveis' },
                { href: '/ministros', icone: '⛪', titulo: 'Ministros' },
                { href: '/cultos', icone: '📅', titulo: 'Cultos' },
                { href: '/escalas', icone: '📋', titulo: 'Escalas' },
                { href: '/materiais', icone: '📚', titulo: 'Materiais' },
                { href: '/avisos', icone: '📣', titulo: 'Avisos' },
            ]
        }

        // MINISTRO
        if (roleUsuario === 'ministro') {
            return [
                { href: '/ministro', icone: '🏠', titulo: 'Início' },
                { href: '/cultos', icone: '📅', titulo: 'Cultos' },
                { href: '/escalas', icone: '📋', titulo: 'Escalas' },
                { href: '/materiais', icone: '📚', titulo: 'Materiais' },
                { href: '/avisos', icone: '📣', titulo: 'Avisos' },
            ]
        }

        // PAI/RESPONSÁVEL
        if (roleUsuario === 'pai') {
            return [
                { href: '/pai', icone: '🏠', titulo: 'Início' },
                { href: '/cultos', icone: '📅', titulo: 'Cultos' },
                { href: '/escalas', icone: '🍰', titulo: 'Lanches' },
                { href: '/materiais', icone: '📚', titulo: 'Devocionais' },
                { href: '/avisos', icone: '📣', titulo: 'Avisos' },
            ]
        }

        // JUVENIL
        if (roleUsuario === 'juvenil') {
            return [
                { href: '/juvenil', icone: '🏠', titulo: 'Início' },
                { href: '/materiais', icone: '📚', titulo: 'Materiais' },
                { href: '/avisos', icone: '📣', titulo: 'Avisos' },
            ]
        }

        return []
    }

    const menuItems = getMenuItems()

    // Label do role em português
    function labelRole(role: string) {
        const labels: { [key: string]: string } = {
            lider: 'Líder',
            ministro: 'Ministro',
            pai: 'Responsável',
            juvenil: 'Juvenil'
        }
        return labels[role] || role
    }

    return (
        <>
            {/* Botão Menu Mobile */}
            <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg"
            >
                {menuAberto ? '✖️' : '☰'}
            </button>

            {/* Overlay Mobile */}
            {menuAberto && (
                <div
                    onClick={() => setMenuAberto(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-72 bg-white shadow-xl z-40
                transform transition-transform duration-300
                ${menuAberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
            `}>
                {/* Cabeçalho */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">🙏</span>
                        <div>
                            <h1 className="text-xl font-bold">Rede Juvenil</h1>
                            <p className="text-xs text-blue-100">10 a 12 anos</p>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur">
                        <p className="text-sm font-semibold truncate">{nomeUsuario}</p>
                        <p className="text-xs text-blue-100 truncate">{emailUsuario}</p>
                        <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {labelRole(roleUsuario)}
                        </span>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item) => {
                            const ativo = pathname === item.href
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMenuAberto(false)}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                            ${ativo 
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <span className="text-xl">{item.icone}</span>
                                        <span className="font-medium">{item.titulo}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Rodapé com botão de sair */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition font-medium"
                    >
                        <span className="text-xl">🚪</span>
                        <span>Sair</span>
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-4">
                        © 2025 Rede Juvenil
                    </p>
                </div>
            </aside>
        </>
    )
}