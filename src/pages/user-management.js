import { useState, useEffect } from 'react'
import Link from 'next/link'
import { userManagementService } from '../services/userManagementService'
import { authService } from '../services/authService'
import styles from '../styles/UserManagement.module.css'

export default function UserManagement() {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    // 로그인 체크 및 관리자 권한 체크
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      window.location.href = '/login'
      return
    }
    
    // 간단한 관리자 체크 (실제로는 백엔드에서 권한 체크)
    if (currentUser.email !== 'admin@minicarrot.com') {
      alert('관리자만 접근할 수 있습니다.')
      window.location.href = '/'
      return
    }
    
    setUser(currentUser)
    loadUsers()
  }, [currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await userManagementService.getUsers(currentPage, 20)
      
      if (response.success) {
        setUsers(response.data.content || response.data)
        setTotalPages(response.data.totalPages || 1)
      }
    } catch (err) {
      setError('사용자 목록을 불러오는데 실패했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchKeyword.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const response = await userManagementService.searchUsers(searchKeyword)
      
      if (response.success) {
        setSearchResults(response.data.content || response.data)
      }
    } catch (err) {
      setError('사용자 검색에 실패했습니다: ' + err.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`정말로 사용자 "${userEmail}"를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await userManagementService.deleteUser(userId)
      
      if (response.success) {
        alert('사용자가 성공적으로 삭제되었습니다.')
        
        // 목록에서 제거
        setUsers(users.filter(u => u.id !== userId))
        setSearchResults(searchResults.filter(u => u.id !== userId))
      }
    } catch (err) {
      alert('사용자 삭제에 실패했습니다: ' + err.message)
    }
  }

  const clearSearch = () => {
    setSearchKeyword('')
    setSearchResults([])
    setIsSearching(false)
  }

  const displayUsers = isSearching || searchResults.length > 0 ? searchResults : users

  if (loading && users.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>👥 사용자 목록 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>🥕 미니 당근</Link>
          <nav className={styles.nav}>
            <Link href="/">홈</Link>
            <Link href="/analytics">분석</Link>
            <Link href="/mypage">마이페이지</Link>
            <span className={styles.user}>관리자: {user?.nickname}님</span>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.titleSection}>
          <h1>👥 사용자 관리</h1>
          <p>등록된 사용자들을 관리하세요</p>
        </div>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* 검색 섹션 */}
        <section className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="이메일 또는 닉네임으로 검색..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton} disabled={isSearching}>
              {isSearching ? '검색 중...' : '🔍 검색'}
            </button>
            {(isSearching || searchResults.length > 0) && (
              <button type="button" onClick={clearSearch} className={styles.clearButton}>
                ❌ 초기화
              </button>
            )}
          </form>
        </section>

        {/* 사용자 목록 */}
        <section className={styles.userList}>
          <div className={styles.listHeader}>
            <h2>
              {isSearching || searchResults.length > 0 
                ? `검색 결과 (${searchResults.length}명)` 
                : `전체 사용자 (${users.length}명)`
              }
            </h2>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이메일</th>
                  <th>닉네임</th>
                  <th>가입일</th>
                  <th>마지막 로그인</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.length > 0 ? (
                  displayUsers.map(userItem => (
                    <tr key={userItem.id}>
                      <td className={styles.userId}>#{userItem.id}</td>
                      <td className={styles.userEmail}>{userItem.email}</td>
                      <td className={styles.userNickname}>{userItem.nickname}</td>
                      <td className={styles.userDate}>
                        {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className={styles.userDate}>
                        {userItem.lastLoginAt ? new Date(userItem.lastLoginAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className={styles.userActions}>
                        {userItem.email !== 'admin@minicarrot.com' && (
                          <button
                            onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                            className={styles.deleteButton}
                          >
                            🗑️ 삭제
                          </button>
                        )}
                        {userItem.email === 'admin@minicarrot.com' && (
                          <span className={styles.adminBadge}>👑 관리자</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      {isSearching ? '🔍 검색 결과가 없습니다' : '👥 등록된 사용자가 없습니다'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 페이지네이션 (검색 중이 아닐 때만 표시) */}
        {!isSearching && searchResults.length === 0 && totalPages > 1 && (
          <section className={styles.pagination}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={styles.pageButton}
            >
              ← 이전
            </button>
            
            <span className={styles.pageInfo}>
              {currentPage + 1} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className={styles.pageButton}
            >
              다음 →
            </button>
          </section>
        )}

        {/* 통계 정보 */}
        <section className={styles.statsSection}>
          <div className={styles.statCard}>
            <h3>📊 사용자 통계</h3>
            <div className={styles.statGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>총 사용자</span>
                <span className={styles.statValue}>{users.length}명</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>오늘 가입</span>
                <span className={styles.statValue}>
                  {users.filter(u => {
                    if (!u.createdAt) return false
                    const today = new Date().toDateString()
                    const userDate = new Date(u.createdAt).toDateString()
                    return today === userDate
                  }).length}명
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 