import { useState } from 'react'
import { useRouter } from 'next/router'
import { authService } from '../services/authService'
import Layout from '../components/Layout'
import styles from '../styles/Auth.module.css'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    confirmPassword: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      const { confirmPassword, ...registerData } = formData
      await authService.register(registerData)
      alert('회원가입이 완료되었습니다! 로그인해주세요.')
      router.push('/login')
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
          <h1 className={styles.title}>회원가입</h1>
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
              <label htmlFor="nickname">닉네임</label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="닉네임을 입력하세요"
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
            <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
        </form>
          <p className={styles.linkText}>
            이미 계정이 있으신가요? <a href="/login">로그인</a>
          </p>
        </div>
      </div>
    </Layout>
  )
} 