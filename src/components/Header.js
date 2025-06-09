import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../services/authService'
import styles from '../styles/Header.module.css'

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const authenticated = authService.isAuthenticated()
    setIsLoggedIn(authenticated)
    
    if (authenticated) {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
    }
  }, [])

  const handleLogout = () => {
    authService.logout()
    setIsLoggedIn(false)
    router.push('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/">
            <h1>🥕 Mini 당근마켓</h1>
          </Link>
        </div>
        
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>
            홈
          </Link>
          {isLoggedIn && (
            <>
              <Link href="/products/create" className={styles.navLink}>
                상품 등록
              </Link>
              <Link href="/analytics" className={styles.navLink}>
                📊 분석
              </Link>
              {user?.email === 'admin@minicarrot.com' && (
                <Link href="/user-management" className={styles.navLink}>
                  👥 사용자 관리
                </Link>
              )}
            </>
          )}
        </nav>

        <div className={styles.authSection}>
          {isLoggedIn ? (
            <div className={styles.userMenu}>
              <Link href="/mypage" className={styles.navLink}>
                마이페이지
              </Link>
              <button 
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/login" className={styles.navLink}>
                로그인
              </Link>
              <Link href="/register" className={styles.navLink}>
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 