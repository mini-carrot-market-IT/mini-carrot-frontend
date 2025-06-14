import { useState } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../services/authService'
import Layout from '../components/Layout'
import styles from '../styles/Auth.module.css'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authService.login(formData)
      alert('로그인 성공!')
      router.push('/')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>로그인</h1>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="이메일을 입력하세요"
              required
            />
          </div>
            <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
        </form>
          <p className={styles.linkText}>
            계정이 없으신가요? <a href="/register">회원가입</a>
          </p>
        </div>
      </div>
    </Layout>
  )
} 