import Header from './Header'

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>&copy; 2024 미니 당근마켓. All rights reserved.</p>
      </footer>
    </div>
  )
} 