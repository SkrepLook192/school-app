import React, { useState, useEffect } from "react";
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import 'animate.css';
import "./App.css";
import AdminDashboard from './AdminDashboard';

const API_BASE_URL = 'http://127.0.0.1:5000/api/auth';

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleContact = () => setIsContactOpen(!isContactOpen);
  const toggleAuthModal = () => {
    setIsAuthModalOpen(!isAuthModalOpen);
    setError(null);
  };
  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const credentials = {
      Username: formData.get('username'),
      Password: formData.get('password')
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials);
      
      localStorage.setItem('authToken', response.data.token);
      const userData = {
        name: response.data.Username,
        role: response.data.Role
      };
      setIsLoggedIn(true);
      setUser(userData);
      setIsAuthModalOpen(false);
      
      // Перенаправляем только админов
      if (response.data.Role === 'Admin') {
        navigate('/admin');
      }
      // Пользователи остаются на текущей странице
      
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      setError(error.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    const userData = {
      Username: formData.get('username'),
      PasswordHash: password,
      Role: 'User' // По умолчанию регистрируем как обычного пользователя
    };

    try {
      await axios.post(`${API_BASE_URL}/register`, userData);
      
      // Автоматический вход после регистрации
      const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
        Username: userData.Username,
        Password: userData.PasswordHash
      });
      
      localStorage.setItem('authToken', loginResponse.data.token);
      setIsLoggedIn(true);
      setUser({
        name: loginResponse.data.Username,
        role: loginResponse.data.Role
      });
      setIsAuthModalOpen(false);
      
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setError(error.response?.data?.message || 'Ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const userData = {
            name: decoded.username,
            role: decoded.role
          };
          setIsLoggedIn(true);
          setUser(userData);
          
          // Автоматическое перенаправление только для админов
          if (decoded.role === 'Admin' && !window.location.pathname.startsWith('/admin')) {
            navigate('/admin');
          }
          
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Интерцептор для добавления токена
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(config => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const renderAuthForm = () => (
    <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="username">Логин</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          required 
          disabled={isLoading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Пароль</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required 
          minLength="6" 
          disabled={isLoading}
        />
      </div>
      
      {!isLoginMode && (
        <div className="form-group">
          <label htmlFor="confirm-password">Подтвердите пароль</label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirm-password" 
            required 
            minLength="6" 
            disabled={isLoading}
          />
        </div>
      )}
      
      <button 
        type="submit" 
        className="submit-btn" 
        disabled={isLoading}
      >
        {isLoading ? 'Загрузка...' : isLoginMode ? 'Войти' : 'Зарегистрироваться'}
      </button>
    </form>
  );

  return (
    <div>
      <Routes>
        <Route path="/admin" element={
          isLoggedIn && user?.role === 'Admin' ? (
            <AdminDashboard user={user} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        } />
        
        <Route path="/" element={
          <div className="App">
            <header className="header animate__animated animate__fadeIn">
              <div className="logo">
                <h1>Школьный Дневник</h1>
              </div>
              
              <div className="auth-section">
                {isLoggedIn ? (
                  <div className="user-profile">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-role">{user?.role}</span>
                    <button className="btn logout-btn" onClick={handleLogout}>Выйти</button>
                  </div>
                ) : (
                  <div className="auth-btns">
                    <button 
                      className="btn login-btn" 
                      onClick={() => { 
                        setIsLoginMode(true); 
                        toggleAuthModal(); 
                      }}
                    >
                      Войти
                    </button>
                    <button 
                      className="btn register-btn" 
                      onClick={() => { 
                        setIsLoginMode(false); 
                        toggleAuthModal(); 
                      }}
                    >
                      Регистрация
                    </button>
                  </div>
                )}
              </div>
            </header>

            {isAuthModalOpen && (
              <div className="auth-modal-overlay">
                <div className="auth-modal animate__animated animate__zoomIn">
                  <button className="close-modal" onClick={toggleAuthModal}>×</button>
                  <h2>{isLoginMode ? 'Вход в аккаунт' : 'Регистрация'}</h2>
                  {renderAuthForm()}
                  <p className="switch-mode">
                    {isLoginMode ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                    <span onClick={switchMode}>
                      {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <main className="main-content">
              <section className="intro animate__animated animate__fadeInUp">
                <h2>Добро пожаловать в школьный дневник</h2>
                <p>Удобный инструмент для управления учебным процессом, отслеживания успеваемости и организации расписания.</p>
              </section>

              <section className="about animate__animated animate__fadeInUp animate__delay-1s">
                <button className={`accordion ${isDropdownOpen ? 'active' : ''}`} onClick={toggleDropdown}>
                  О приложении
                  <span className="accordion-icon">{isDropdownOpen ? '−' : '+'}</span>
                </button>
                <div className={`panel ${isDropdownOpen ? 'show' : ''}`}>
                  <p>Школьный дневник - это современное веб-приложение, разработанное для упрощения учебного процесса.</p>
                  <ul>
                    <li>Удобный интерфейс для учеников, учителей и родителей</li>
                    <li>Автоматическое формирование отчетов</li>
                    <li>Уведомления о важных событиях</li>
                    <li>Доступ с любых устройств</li>
                  </ul>
                </div>
              </section>

              <section className="opportunities animate__animated animate__fadeInUp animate__delay-2s">
                <button className={`accordion ${isContactOpen ? 'active' : ''}`} onClick={toggleContact}>
                  Возможности
                  <span className="accordion-icon">{isContactOpen ? '−' : '+'}</span>
                </button>
                <div className={`panel ${isContactOpen ? 'show' : ''}`}>
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">📊</div>
                      <h3>Отслеживание оценок</h3>
                      <p>Полная статистика по всем предметам</p>
                    </div>
                    <div className="feature-card">
                      <div className="feature-icon">📅</div>
                      <h3>Расписание</h3>
                      <p>Удобное расписание уроков</p>
                    </div>
                    <div className="feature-card">
                      <div className="feature-icon">📝</div>
                      <h3>Домашние задания</h3>
                      <p>Записи домашних заданий</p>
                    </div>
                    <div className="feature-card">
                      <div className="feature-icon">🔔</div>
                      <h3>Уведомления</h3>
                      <p>Оповещения о важных событиях</p>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <footer className="footer animate__animated animate__fadeInUp animate__delay-3s">
              <div className="footer-content">
                <div className="footer-section">
                  <h4>Контакты</h4>
                  <p>email@school.com</p>
                  <p>+7 (123) 456-78-90</p>
                </div>
                <div className="footer-section">
                  <h4>Поддержка</h4>
                  <p>Помощь</p>
                  <p>FAQ</p>
                </div>
                <div className="footer-section">
                  <h4>Социальные сети</h4>
                  <div className="social-icons">
                    <span>📘</span>
                    <span>📸</span>
                    <span>📱</span>
                  </div>
                </div>
              </div>
              <div className="copyright">
                <p>&copy; 2025 Школьный Дневник</p>
              </div>
            </footer>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;