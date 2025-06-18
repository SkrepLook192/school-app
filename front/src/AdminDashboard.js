import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const API_URL = "http://localhost:5000/api";
  const navigate = useNavigate();

  // Состояния для управления интерфейсом
  const [activeTab, setActiveTab] = useState('teachers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // ——— ВКЛАДКА “УСПЕВАЕМОСТЬ” ———
  const [selectedClassForGrades, setSelectedClassForGrades] = useState('');
  const [studentsAverages, setStudentsAverages] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [newGradeEntry, setNewGradeEntry] = useState({
    subjectId: '',
    grade: ''
  });
  // Новое состояние для редактирования оценки
  const [editingGrade, setEditingGrade] = useState({ id: null, value: '' });

  // Основные данные
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    worstSubject: '',
    failingStudents: 0,
    worstTeacher: '',
    classAverages: {},
    bestClass: '',
    worstClass: ''
  });

  // Состояния для форм
  const [selectedUserId, setSelectedUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [classroomNumber, setClassroomNumber] = useState('');
  const [newStudent, setNewStudent] = useState({
    name: '',
    class: '',
    userId: '',
    userQuery: ''
  });
  
  const [newGrades, setNewGrades] = useState({ 
    student: '', 
    subject1: '', 
    subject2: '', 
    subject3: '' 
  });
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'User'
  });
  const [newClass, setNewClass] = useState({
    name: '',
    academicYear: '',
    roomNumber: ''
  });
  const [newSubject, setNewSubject] = useState({
    name: '',
    teacherId: '',
    teacherQuery: ''
  });

  // Пагинация
  const [pagination, setPagination] = useState({
    teachers: { page: 1, perPage: 10, total: 0 },
    students: { page: 1, perPage: 10, total: 0 },
    grades: { page: 1, perPage: 10, total: 0 },
    users: { page: 1, perPage: 10, total: 0 },
    classrooms: { page: 1, perPage: 10, total: 0 },
    subjects: { page: 1, perPage: 10, total: 0 }
  });

  // Фильтры
  const [filters, setFilters] = useState({
    teachers: { room: '' },
    students: { class: '' },
    grades: { subject: '', minGrade: '', maxGrade: '' },
    users: { role: '' },
    classrooms: { academicYear: '' },
    subjects: { teacher: '' }
  });

  // Проверка авторизации и роли
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      toast.warning('Доступ запрещен. Требуется вход в систему.');
      return;
    }
    const { role } = jwtDecode(token);
    if (role !== 'Admin') {
      navigate('/');
      toast.warning('Доступ запрещен. Требуются права администратора.');
    }
  }, [navigate]);

  // один раз при монтировании
  useEffect(() => {
    fetchClassrooms();
  }, []);

  // Загрузка данных при монтировании и смене вкладки
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        switch (activeTab) {
          case 'teachers':
            await Promise.all([
              fetchTeachers(),
              fetchUsers(pagination.users.page, 'Teacher')
            ]);
            break;
          case 'students':
            await Promise.all([
              fetchStudents(),
              fetchClassrooms(),      
            ]);
            break;
          case 'grades':
            await Promise.all([
              fetchStudents(pagination.students.page),
              fetchGrades(),
              fetchSubjects()
            ]);
            break;
          case 'stats':
            await fetchStats();
            break;
          case 'users':
            await fetchUsers();
            break;
          case 'classrooms':
            await fetchClassrooms();
            break;
          case 'subjects':
            await fetchSubjects();
            break;
          default:
            break;
        }
      } catch (err) {
        setError(err.message);
        toast.error(`Ошибка загрузки данных: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // API функции
  const fetchTeachers = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/teacher`, {
        params: { 
          page, 
          limit: pagination.teachers.perPage,
          search: searchTerm,
          ...filters.teachers
        },
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('authToken')}` 
        }
      });
      setTeachers(response.data.teachers);
      setPagination(prev => ({
        ...prev,
        teachers: {
          ...prev.teachers,
          page,
          total: response.data.totalCount
        }
      }));
    } catch (err) {
      toast.error('Ошибка загрузки учителей');
      throw err;
    }
  };

  const fetchStudents = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/student`, {
        params: { 
          page, 
          limit: pagination.students.perPage,
          search: searchTerm,
          ...filters.students
        },
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('authToken')}` 
        }
      });
      const studentsData = Array.isArray(response.data)
          ? response.data
          : response.data.students;
      setStudents(studentsData);
      setPagination(prev => ({
        ...prev,
        students: {
          ...prev.students,
          page,
          total: studentsData.length
        }
      }));
    } catch (err) {
      toast.error('Ошибка загрузки студентов');
      throw err;
    }
  };

  const fetchGrades = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/grade`, {
        params: {
          page,
          limit: pagination.grades.perPage,
          search: searchTerm,
          ...filters.grades
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const gradesList = Array.isArray(response.data)
        ? response.data
        : response.data.grades ?? [];
      setGrades(gradesList);
  
      const total = response.data.totalCount ?? gradesList.length;
      setPagination(prev => ({
        ...prev,
        grades: {
          ...prev.grades,
          page,
          total
        }
      }));
    } catch (err) {
      toast.error('Ошибка загрузки оценок');
      throw err;
    }
  };
  
  const computeAverages = () => {
    if (!selectedClassForGrades) {
      setStudentsAverages([]);
      return;
    }
  
    const classStudents = students.filter(
      s => s.ClassID === selectedClassForGrades
    );
  
    const result = classStudents.map(st => {
      const recs = grades.filter(g => g.StudentID === st.StudentID);
  
      if (recs.length === 0) {
        return { 
          id: st.StudentID,
          name: st.FullName,
          average: null
        };
      }
  
      let total = 0, count = 0;
      recs.forEach(g => {
        total += parseFloat(g.GradeValue);
        count += 1;
      });
  
      return {
        id: st.StudentID,
        name: st.FullName,
        average: count > 0 ? total / count : null
      };
    });
  
    setStudentsAverages(result);
  };
  
  useEffect(() => {
    computeAverages();
  }, [selectedClassForGrades, grades]);

  const toggleStudent = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
    setNewGradeEntry({ subjectId: '', grade: '' });
    setEditingGrade({ id: null, value: '' }); // Сбрасываем редактирование при переключении
  };

  const handleAddGradeForStudent = async (studentId) => {
    if (!newGradeEntry.subjectId || !newGradeEntry.grade) {
      toast.error('Выберите предмет и оценку');
      return;
    }
    try {
      await axios.post(`${API_URL}/grade`, {
        StudentID: studentId,
        SubjectID: newGradeEntry.subjectId,
        GradeValue: newGradeEntry.grade,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      toast.success('Оценка добавлена');
      await fetchGrades();
    } catch (e) {
      toast.error('Ошибка при добавлении оценки');
    }
  };

  // Новые хэндлеры для редактирования оценки
  const startEditGrade = (gradeId, currentValue) => {
    setEditingGrade({ id: gradeId, value: currentValue });
  };

  const cancelEditGrade = () => {
    setEditingGrade({ id: null, value: '' });
  };

  const saveEditGrade = async (gradeId) => {
    try {
      await axios.put(`${API_URL}/grade/${gradeId}`, {
        GradeValue: editingGrade.value
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      toast.success('Оценка обновлена');
      cancelEditGrade();
      fetchGrades();
    } catch {
      toast.error('Ошибка при обновлении оценки');
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const res = await axios.get(`${API_URL}/user`, {
        params: {
          page,
          limit: pagination.users.perPage,
          search: searchTerm,
          role: filters.users.role,
          sortBy: 'UserID',
          order: 'asc'
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      const totalHeader = res.headers['x-total-count'] || res.headers['X-Total-Count'];
      const totalCount = parseInt(totalHeader, 10);

      setUsers([...res.data].sort((a, b) => a.UserID - b.UserID));
      setPagination(prev => ({
        ...prev,
        users: {
          ...prev.users,
          page,
          total: isNaN(totalCount) ? 0 : totalCount
        }
      }));
    } catch (err) {
      toast.error('Ошибка загрузки пользователей');
      throw err;
    }
  };

  const fetchClassrooms = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/class`, {
        params: {
          page,
          limit: pagination.classrooms.perPage,
          search: searchTerm,
          ...filters.classrooms
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setClassrooms(response.data.classes || []);
      setPagination(prev => ({
        ...prev,
        classrooms: {
          ...prev.classrooms,
          page,
          total: response.data.totalCount || 0
        }
      }));
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      toast.error('Ошибка загрузки классов');
      throw err;
    }
  };

  const fetchSubjects = async (page = 1) => {
    try {
      const res = await axios.get(`${API_URL}/subject`, {
        params: {
          page,
          limit: pagination.subjects.perPage,
          search: searchTerm,
          teacher: filters.subjects.teacher
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
  
      const list = Array.isArray(res.data) ? res.data : res.data.subjects;
      setSubjects(list);
  
      const total = parseInt(res.headers['x-total-count'] || list.length, 10);
      setPagination(prev => ({
        ...prev,
        subjects: {
          page,
          perPage: prev.subjects.perPage,
          total
        }
      }));
    } catch (err) {
      toast.error('Ошибка загрузки предметов');
      throw err;
    }
  };

  const fetchStats = async () => {
    try {
      const [failing, worstTeacher, classStats, worstSubject] = await Promise.all([
        axios.get(`${API_URL}/report/failing`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }),
        axios.get(`${API_URL}/report/worst-teacher`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }),
        axios.get(`${API_URL}/report/class`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }),
        axios.get(`${API_URL}/report/worst-subject`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        })
      ]);
      
      setStats({
        worstSubject: worstSubject?.data?.SubjectName || 'Нет данных',
        failingStudents: failing.data.count || 0,
        worstTeacher: worstTeacher.data[0]?.name || 'Нет данных',
        classAverages: classStats.data.reduce((acc, curr) => {
          acc[curr.className] = parseFloat(curr.average);
          return acc;
        }, {}),
        
        bestClass: classStats.data.length > 0 
          ? classStats.data.reduce((prev, current) => 
              (prev.average > current.average) ? prev : current
            ).className 
          : 'Нет данных',
        worstClass: classStats.data.length > 0 
          ? classStats.data.reduce((prev, current) => 
              (prev.average < current.average) ? prev : current
            ).className 
          : 'Нет данных'
      });
    } catch (err) {
      toast.error('Ошибка загрузки статистики');
      throw err;
    }
  };

  // Функция для добавления/редактирования
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (modalType === 'teacher') {
        if (!selectedUserId || !fullName.trim()) {
          toast.error('Выберите пользователя и введите полное имя');
          return;
        }

        const payload = {
          UserID: selectedUserId,
          FullName: fullName,
          ClassroomNumber: classroomNumber || null
        };

        await axios.post(
          `${API_URL}/teacher`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Учитель успешно назначен');
        await fetchTeachers(pagination.teachers.page);
      }

      else if (modalType === 'edit_teacher') {
        if (!fullName.trim()) {
          toast.error('Введите полное имя');
          return;
        }

        if (!selectedUserId) {
          toast.error('Выберите пользователя');
          return;
        }

        const payload = {
          FullName: fullName,
          ClassroomNumber: classroomNumber || null,
          UserID: selectedUserId
        };

        await axios.put(
          `${API_URL}/teacher/${editId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Данные учителя успешно обновлены');
        await fetchTeachers(pagination.teachers.page);
      }

      else if (modalType === 'student' || modalType === 'edit_student') {
        if (!newStudent.name.trim() || !newStudent.class || !newStudent.userId) {
          toast.error('Заполните все поля для ученика');
          return;
        }
      
        const selectedClass = classrooms.find(c => c.Name === newStudent.class);
        if (!selectedClass) {
          toast.error('Выбранный класс не найден');
          return;
        }
      
        const payload = {
          UserID: +newStudent.userId,
          FullName: newStudent.name,
          ClassID: selectedClass.ClassID
        };
      
        if (modalType === 'student') {
          await axios.post(
            `${API_URL}/student`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          toast.success('Ученик успешно создан');
        } else {
          await axios.put(
            `${API_URL}/student/${editId}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          toast.success('Данные ученика успешно обновлены');
        }
        await fetchStudents(pagination.students.page);
      }

      else if (modalType === 'grades' || modalType === 'edit_grades') {
        if (!newGrades.student || !newGrades.subject1 || !newGrades.subject2 || !newGrades.subject3) {
          toast.error('Заполните все поля для оценок');
          return;
        }

        if (modalType === 'grades') {
          await axios.post(
            `${API_URL}/grade`,
            {
              StudentName: newGrades.student,
              Subject1Grade: newGrades.subject1,
              Subject2Grade: newGrades.subject2,
              Subject3Grade: newGrades.subject3
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          toast.success('Оценки успешно добавлены');
        } else {
          await axios.put(
            `${API_URL}/grade/${editId}`,
            {
              StudentName: newGrades.student,
              Subject1Grade: newGrades.subject1,
              Subject2Grade: newGrades.subject2,
              Subject3Grade: newGrades.subject3
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          toast.success('Оценки успешно обновлены');
        }
        await fetchGrades(pagination.grades.page);
      }

      else if (modalType === 'class') {
        if (!newClass.name.trim() || !newClass.academicYear || !newClass.roomNumber) {
          toast.error('Заполните все поля для класса');
          return;
        }
        await axios.post(
          `${API_URL}/class`,
          {
            Name: newClass.name,
            AcademicYear: newClass.academicYear,
            RoomNumber: newClass.roomNumber
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Класс успешно создан');
        await fetchClassrooms(pagination.classrooms.page);
      }
      else if (modalType === 'edit_class') {
        if (!newClass.name.trim() || !newClass.academicYear || !newClass.roomNumber) {
          toast.error('Заполните все поля для класса');
          return;
        }
      
        await axios.put(
          `${API_URL}/class/${editId}`,
          {
            Name: newClass.name,
            AcademicYear: newClass.academicYear,
            RoomNumber: newClass.roomNumber
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Данные класса успешно обновлены');
        await fetchClassrooms(pagination.classrooms.page);
      }
      
      else if (modalType === 'subject') {
        if (!newSubject.name || !newSubject.teacherId) {
          toast.error('Введите название и выберите учителя');
          return;
        }
        await axios.post(`${API_URL}/subject`, {
          Name: newSubject.name,
          TeacherID: newSubject.teacherId
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        toast.success('Предмет создан');
        await fetchSubjects(pagination.subjects.page);
      }
      else if (modalType === 'edit_subject') {
        if (!newSubject.name || !newSubject.teacherId) {
          toast.error('Введите название и выберите учителя');
          return;
        }
        await axios.put(`${API_URL}/subject/${editId}`, {
          Name: newSubject.name,
          TeacherID: newSubject.teacherId
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        toast.success('Данные предмета обновлены');
        await fetchSubjects(pagination.subjects.page);
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при сохранении данных');
      setError(err.response?.data?.details || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (type) => {
    setModalType(type);
    setEditId(null);
    setShowAddModal(true);
    setError(null);
    resetForm();
  };

  const handleEdit = (type, id) => {
    let data;
    if (type === 'teacher') {
      data = teachers.find(t => t.TeacherID === id);
      setFullName(data.FullName);
      setClassroomNumber(data.ClassroomNumber || '');
      setSelectedUserId(data.UserID);
    } else if (type === 'student') {
      const data = students.find(s => s.StudentID === id);
      setNewStudent({
        name: data.FullName,
        class: data.ClassName,
        userId: data.UserID,
        userQuery: users.find(u => u.UserID === data.UserID)?.Username || ''
      });
    }
    else if (type === 'grades') {
      data = grades.find(g => g.id === id);
      setNewGrades({
        student: data.studentName,
        subject1: data.subject1Grade,
        subject2: data.subject2Grade,
        subject3: data.subject3Grade
      });
    } else if (type === 'user') {
      data = users.find(u => u.UserID === id);
      setNewUser({
        username: data.Username,
        password: '',
        confirmPassword: '',
        role: data.Role
      });
    } else if (type === 'class') {
      data = classrooms.find(c => c.ClassID === id);
      setNewClass({
        name: data.Name,
        academicYear: data.AcademicYear,
        roomNumber: data.RoomNumber
      });
    } else if (type === 'subject') {
      data = subjects.find(s => s.SubjectID === id);
      setNewSubject({
        name: data.Name,
        teacherId: data.TeacherID,
        teacherQuery: data.TeacherName
      });
    }

    setModalType(`edit_${type}`);
    setEditId(id);
    setShowAddModal(true);
  };

  const handleDelete = async (id, type) => {
    try {
      setIsLoading(true);
      if (!window.confirm(`Вы уверены, что хотите удалить этот ${type === 'teacher' ? 'учитель' : type === 'student' ? 'ученик' : type === 'user' ? 'пользователь' : type === 'class' ? 'класс' : type === 'subject' ? 'предмет' : 'оценку'}?`)) {
        return;
      }

      await axios.delete(`${API_URL}/${type}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      toast.success(`Успешно удалено!`);

      if (type === 'teacher') await fetchTeachers(pagination.teachers.page);
      else if (type === 'student') await fetchStudents(pagination.students.page);
      else if (type === 'user') await fetchUsers(pagination.users.page);
      else if (type === 'class') await fetchClassrooms(pagination.classrooms.page);
      else if (type === 'subject') await fetchSubjects(pagination.subjects.page);
      else await fetchGrades(pagination.grades.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при удалении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (!newUser.username || !newUser.role || (modalType === 'user' && (!newUser.password || !newUser.confirmPassword))) {
        toast.error('Заполните все обязательные поля');
        return;
      }

      if (modalType === 'user' && newUser.password !== newUser.confirmPassword) {
        toast.error('Пароли не совпадают');
        return;
      }

      if (modalType === 'user' && newUser.password.length < 6) {
        toast.error('Пароль должен быть не менее 6 символов');
        return;
      }

      if (modalType === 'edit_user') {
        const payload = {
          Username: newUser.username,
          Role: newUser.role
        };
        if (newUser.password && newUser.confirmPassword) {
          if (newUser.password !== newUser.confirmPassword) {
            toast.error('Пароли не совпадают');
            return;
          }
          if (newUser.password.length < 6) {
            toast.error('Пароль должен быть не менее 6 символов');
            return;
          }
          payload.password = newUser.password;
        }
        
        await axios.put(
          `${API_URL}/user/${editId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Пользователь обновлен');
      }
      else {
        await axios.post(
          `${API_URL}/user`,
          {
            username: newUser.username,
            password: newUser.password,
            role: newUser.role
          },
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success('Пользователь успешно создан');
      }

      await fetchUsers(pagination.users.page);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка при сохранении пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setFullName('');
    setClassroomNumber('');
    setNewStudent({ name: '', class: '', userId: '', userQuery: '' });
    setNewGrades({ student: '', subject1: '', subject2: '', subject3: '' });
    setNewUser({ username: '', password: '', confirmPassword: '', role: 'User' });
    setNewClass({ name: '', academicYear: '', roomNumber: '' });
    setNewSubject({ name: '', teacherId: '', teacherQuery: '' });
    setEditId(null);
    setEditingGrade({ id: null, value: '' }); // Сбрасываем редактирование
  };

  const exportData = async (type) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/export/${type}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Данные ${type} успешно экспортированы`);
    } catch (err) {
      toast.error(`Ошибка экспорта: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = (data, type) => {
    if (!data) return [];
    
    return data.filter(item => {
      const matchesSearch = 
        item.FullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.TeacherName?.toLowerCase().includes(searchTerm.toLowerCase());
      const studentClassName = type === 'students'
        ? (classrooms.find(c => c.ClassID === item.ClassID)?.Name || '')
        : '';
      
      const matchesFilters = 
        (type !== 'teachers' || (
          !filters.teachers.room || item.ClassroomNumber?.toString().includes(filters.teachers.room)
        )) &&
        (type !== 'students' || (
          !filters.students.class ||
          studentClassName.toLowerCase().includes(filters.students.class.toLowerCase())
        )) &&
        (type !== 'grades' || (
          (!filters.grades.subject || (
            item.subject1Name?.includes(filters.grades.subject) ||
            item.subject2Name?.includes(filters.grades.subject) ||
            item.subject3Name?.includes(filters.grades.subject)
          )) &&
          (!filters.grades.minGrade || (
            item.subject1Grade >= +filters.grades.minGrade &&
            item.subject2Grade >= +filters.grades.minGrade &&
            item.subject3Grade >= +filters.grades.minGrade
          )) &&
          (!filters.grades.maxGrade || (
            item.subject1Grade <= +filters.grades.maxGrade &&
            item.subject2Grade <= +filters.grades.maxGrade &&
            item.subject3Grade <= +filters.grades.maxGrade
          ))
        )) &&
        (type !== 'users' || (
          !filters.users.role || item.Role?.includes(filters.users.role)
        )) &&
        (type !== 'classrooms' || (
          !filters.classrooms.academicYear || item.AcademicYear?.toString().includes(filters.classrooms.academicYear)
        )) &&
        (type !== 'subjects' || (
          !filters.subjects.teacher || item.TeacherName?.toLowerCase().includes(filters.subjects.teacher.toLowerCase())
        ));
      
      return matchesSearch && matchesFilters;
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
    toast.success('Вы успешно вышли из системы');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {isLoading && <div className="loading-overlay">Загрузка...</div>}
      
      <header className="dashboard-header">
        <h1>Панель администратора</h1>
        <div className="header-controls">
          <button 
            className="back-btn"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <i className="fas fa-arrow-left"></i> Выйти
          </button>
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
          <button 
            className="refresh-btn"
            onClick={() => {
              if (activeTab === 'teachers') {
                fetchTeachers(pagination.teachers.page);
                fetchUsers(pagination.users.page, 'Teacher');
              }
              else if (activeTab === 'students') fetchStudents(pagination.students.page);
              else if (activeTab === 'grades') fetchGrades(pagination.grades.page);
              else if (activeTab === 'users') fetchUsers(pagination.users.page);
              else if (activeTab === 'classrooms') fetchClassrooms(pagination.classrooms.page);
              else if (activeTab === 'subjects') fetchSubjects(pagination.subjects.page);
              else fetchStats();
            }}
            disabled={isLoading}
          >
            <i className="fas fa-sync-alt"></i> Обновить
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <nav className="sidebar">
          <ul>
            <li 
              className={activeTab === 'teachers' ? 'active' : ''}
              onClick={() => setActiveTab('teachers')}
            >
              <i className="fas fa-chalkboard-teacher"></i> Учителя
            </li>
            <li 
              className={activeTab === 'students' ? 'active' : ''}
              onClick={() => setActiveTab('students')}
            >
              <i className="fas fa-user-graduate"></i> Ученики
            </li>
            <li 
              className={activeTab === 'grades' ? 'active' : ''}
              onClick={() => setActiveTab('grades')}
            >
              <i className="fas fa-clipboard-list"></i> Успеваемость
            </li>
            <li 
              className={activeTab === 'stats' ? 'active' : ''}
              onClick={() => setActiveTab('stats')}
            >
              <i className="fas fa-chart-bar"></i> Статистика
            </li>
            <li 
              className={activeTab === 'users' ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users"></i> Пользователи
            </li>
            <li 
              className={activeTab === 'classrooms' ? 'active' : ''}
              onClick={() => setActiveTab('classrooms')}
            >
              <i className="fas fa-school"></i> Классы
            </li>
            <li
              className={activeTab === 'subjects' ? 'active' : ''}
              onClick={() => setActiveTab('subjects')}
            >
              <i className="fas fa-book"></i> Предметы
            </li>
          </ul>
        </nav>

        <main className="content">
          {activeTab === 'teachers' && (
            <div className="table-section">
              <div className="section-header">
                <h2>Список учителей</h2>
                <div className="section-actions">
                  <button 
                    className="export-btn"
                    onClick={() => exportData('teachers')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-file-export"></i> Экспорт
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={() => handleAdd('teacher')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus"></i> Добавить
                  </button>
                </div>
              </div>
              
              <div className="filters">
                <input
                  type="text"
                  placeholder="Фильтр по кабинету"
                  value={filters.teachers.room}
                  onChange={(e) => setFilters({
                    ...filters, 
                    teachers: {
                      ...filters.teachers, 
                      room: e.target.value 
                    }
                  })}
                />
              </div>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>TeacherID</th>
                      <th>UserID</th>
                      <th>ФИО</th>
                      <th>Кабинет</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(teachers, 'teachers').map(teacher => (
                      <tr key={teacher.TeacherID}>
                        <td>{teacher.TeacherID}</td>
                        <td>{teacher.UserID}</td>
                        <td>{teacher.FullName}</td>
                        <td>{teacher.ClassroomNumber}</td>
                        <td className="actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit('teacher', teacher.TeacherID)}
                            disabled={isLoading}
                          >
                            <i className="fas fa-edit"></i> Редактировать
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(teacher.TeacherID, 'teacher')}
                            disabled={isLoading}
                          >
                            <i className="fas fa-trash"></i> Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination">
                <button 
                  onClick={() => fetchTeachers(pagination.teachers.page - 1)}
                  disabled={pagination.teachers.page <= 1 || isLoading}
                >
                  Назад
                </button>
                <span>
                  Страница {pagination.teachers.page} из {' '}
                  {Math.ceil(pagination.teachers.total / pagination.teachers.perPage)}
                </span>
                <button 
                  onClick={() => fetchTeachers(pagination.teachers.page + 1)}
                  disabled={
                    pagination.teachers.page * pagination.teachers.perPage >= 
                    pagination.teachers.total || isLoading
                  }
                >
                  Вперед
                </button>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="table-section">
              <div className="section-header">
                <h2>Список учеников</h2>
                <div className="section-actions">
                  <button 
                    className="export-btn"
                    onClick={() => exportData('students')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-file-export"></i> Экспорт
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={() => handleAdd('student')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus"></i> Добавить
                  </button>
                </div>
              </div>
              
              <div className="filters">
                <input
                  type="text"
                  placeholder="Фильтр по классу"
                  value={filters.students.class}
                  onChange={(e) => setFilters({
                    ...filters, 
                    students: {
                      ...filters.students, 
                      class: e.target.value 
                    }
                  })}
                />
              </div>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>ФИО</th>
                      <th>Класс</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(students, 'students').map(student => {
                      const cls = classrooms.find(c => c.ClassID === student.ClassID);
                      return (
                        <tr key={student.StudentID}>
                          <td>{student.StudentID}</td>
                          <td>{student.FullName}</td>
                          <td>{cls ? cls.Name : '—'}</td>
                          <td className="actions">
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit('student', student.StudentID)}
                              disabled={isLoading}
                            >
                              <i className="fas fa-edit"></i> Редактировать
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(student.StudentID, 'student')}
                              disabled={isLoading}
                            >
                              <i className="fas fa-trash"></i> Удалить
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination">
                <button 
                  onClick={() => fetchStudents(pagination.students.page - 1)}
                  disabled={pagination.students.page <= 1 || isLoading}
                >
                  Назад
                </button>
                <span>
                  Страница {pagination.students.page} из {' '}
                  {Math.ceil(pagination.students.total / pagination.students.perPage)}
                </span>
                <button 
                  onClick={() => fetchStudents(pagination.students.page + 1)}
                  disabled={
                    pagination.students.page * pagination.students.perPage >= 
                    pagination.students.total || isLoading
                  }
                >
                  Вперед
                </button>
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="table-section">
              <div className="section-header">
                <h2>Успеваемость</h2>
                <div className="filters">
                  <label>Класс:</label>
                  <select
                    value={selectedClassForGrades}
                    onChange={e => {
                      setSelectedClassForGrades(+e.target.value);
                      setExpandedStudent(null);
                    }}
                    disabled={isLoading}
                  >
                    <option value="">— Выберите класс —</option>
                    {classrooms.map(c => (
                      <option key={c.ClassID} value={c.ClassID}>
                        {c.Name} ({c.AcademicYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Ученик</th>
                      <th>Средний балл по всем предметам</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsAverages.map(s => (
                      <React.Fragment key={s.id}>
                        <tr>
                          <td>{s.name}</td>
                          <td>{s.average != null ? s.average.toFixed(2) : '—'}</td>
                          <td className="actions">
                            <button
                              className="edit-btn"
                              onClick={() => toggleStudent(s.id)}
                              disabled={isLoading}
                            >
                              <i className="fas fa-edit"></i> Редактировать
                            </button>
                          </td>
                        </tr>

                        {expandedStudent === s.id && (
                          <tr className="accordion-row">
                            <td colSpan={3}>
                              <div className="accordion-content">
                                <div className="grades-header">
                                  <h4>Оценки по предметам</h4>
                                  <div className="average-grade">
                                    Средний балл: <span>{s.average != null ? s.average.toFixed(2) : '—'}</span>
                                  </div>
                                </div>
                                
                                <div className="grades-container">
                                  {grades
                                    .filter(g => g.StudentID === s.id)
                                    .map(g => (
                                      <div key={g.GradeID} className="grade-item">
                                        <div className="subject-name">{g.SubjectName}</div>
                                        
                                        {editingGrade.id === g.GradeID ? (
                                          <div className="grade-edit">
                                            <select
                                              value={editingGrade.value}
                                              onChange={e => setEditingGrade(prev => ({ ...prev, value: e.target.value }))}
                                            >
                                              <option value="5">5 (Отлично)</option>
                                              <option value="4">4 (Хорошо)</option>
                                              <option value="3">3 (Удовлетворительно)</option>
                                              <option value="2">2 (Неудовлетворительно)</option>
                                            </select>
                                            <button onClick={() => saveEditGrade(g.GradeID)}>💾</button>
                                            <button onClick={cancelEditGrade}>✖</button>
                                          </div>
                                        ) : (
                                          <div className="grade-display">
                                            <span className="grade-value">{g.GradeValue}</span>
                                            <button 
                                              onClick={() => startEditGrade(g.GradeID, g.GradeValue)}
                                              className="edit-grade-btn"
                                            >
                                              ✎
                                            </button>
                                            <button 
                                              onClick={() => handleDelete(g.GradeID, 'grade')}
                                              className="delete-grade-btn"
                                            >
                                              🗑️
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  }
                                  {grades.filter(g => g.StudentID === s.id).length === 0 && (
                                    <div className="no-grades">Оценок ещё нет</div>
                                  )}
                                </div>

                                <div className="add-grade-form">
                                  <h5>Добавить новую оценку</h5>
                                  <div className="form-row">
                                    <select
                                      className="form-select"
                                      value={newGradeEntry.subjectId}
                                      onChange={e => setNewGradeEntry(prev => ({
                                        ...prev,
                                        subjectId: e.target.value
                                      }))}
                                    >
                                      <option value="">Выберите предмет</option>
                                      {subjects.map(subj => (
                                        <option key={subj.SubjectID} value={subj.SubjectID}>
                                          {subj.Name}
                                        </option>
                                      ))}
                                    </select>

                                    <select
                                      className="form-select"
                                      value={newGradeEntry.grade}
                                      onChange={e => setNewGradeEntry(prev => ({
                                        ...prev,
                                        grade: e.target.value
                                      }))}
                                    >
                                      <option value="">Выберите оценку</option>
                                      <option value="5">5 (Отлично)</option>
                                      <option value="4">4 (Хорошо)</option>
                                      <option value="3">3 (Удовлетворительно)</option>
                                      <option value="2">2 (Неудовлетворительно)</option>
                                    </select>

                                    <button
                                      className="add-grade-btn"
                                      onClick={() => handleAddGradeForStudent(s.id)}
                                    >
                                      Добавить
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-section">
              <div className="section-header">
                <h2>Статистика успеваемости</h2>
                <button 
                  className="refresh-btn"
                  onClick={fetchStats}
                  disabled={isLoading}
                >
                  <i className="fas fa-sync-alt"></i> Обновить
                </button>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon bg-red">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Самый сложный предмет</h3>
                    <p>{stats.worstSubject || 'Нет данных'}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-orange">
                    <i className="fas fa-user-times"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Неуспевающие ученики</h3>
                    <p>{stats.failingStudents}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-purple">
                    <i className="fas fa-chalkboard-teacher"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Самый строгий учитель</h3>
                    <p>{stats.worstTeacher || 'Нет данных'}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-blue">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Средние оценки по классам</h3>
                    <ul>
                      {Object.entries(stats.classAverages).map(([cls, avg]) => (
                        <li key={cls}>
                          {cls}: {typeof avg === 'number' ? avg.toFixed(1) : 'Нет данных'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-green">
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Лучший класс</h3>
                    <p>{stats.bestClass || 'Нет данных'}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-red">
                    <i className="fas fa-sad-tear"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Худший класс</h3>
                    <p>{stats.worstClass || 'Нет данных'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="table-section">
              <div className="section-header">
                <h2>Список пользователей</h2>
                <div className="section-actions">
                  <button 
                    className="export-btn"
                    onClick={() => exportData('users')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-file-export"></i> Экспорт
                  </button>
                  <button 
                    className="add-btn" 
                    onClick={() => handleAdd('user')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus"></i> Добавить
                  </button>
                </div>
              </div>
              
              <div className="filters">
                <select
                  value={filters.users.role}
                  onChange={(e) => setFilters({
                    ...filters, 
                    users: {
                      ...filters.users, 
                      role: e.target.value 
                    }
                  })}
                >
                  <option value="">Все роли</option>
                  <option value="Admin">Администратор</option>
                  <option value="Teacher">Учитель</option>
                  <option value="Student">Ученик</option>
                  <option value="User">Пользователь</option>
                </select>
              </div>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Логин</th>
                      <th>Роль</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(users, 'users').map(user => (
                      <tr key={user.UserID}>
                        <td>{user.UserID}</td>
                        <td>{user.Username}</td>
                        <td>{user.Role}</td>
                        <td className="actions">
                          <button 
                            className="edit-btn"
                            onClick={() => handleEdit('user', user.UserID)}
                            disabled={isLoading || user.Role === 'Admin'}
                          >
                            <i className="fas fa-edit"></i> Редактировать
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(user.UserID, 'user')}
                            disabled={isLoading || user.Role === 'Admin'}
                          >
                            <i className="fas fa-trash"></i> Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination">
                <button 
                  onClick={() => fetchUsers(pagination.users.page - 1)}
                  disabled={pagination.users.page <= 1 || isLoading}
                >
                  Назад
                </button>
                <span>
                  Страница {pagination.users.page} из {' '}
                  {Math.ceil(pagination.users.total / pagination.users.perPage)}
                </span>
                <button 
                  onClick={() => fetchUsers(pagination.users.page + 1)}
                  disabled={
                    pagination.users.page * pagination.users.perPage >= 
                    pagination.users.total || isLoading
                  }
                >
                  Вперед
                </button>
              </div>
            </div>
          )}

          {activeTab === 'classrooms' && (
            <div className="table-section">
              <div className="section-header">
                <h2>Список классов</h2>
                <div className="section-actions">
                  <button
                    className="export-btn"
                    onClick={() => exportData('classes')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-file-export"></i> Экспорт
                  </button>
                  <button
                    className="add-btn"
                    onClick={() => handleAdd('class')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus"></i> Добавить
                  </button>
                </div>
              </div>
              
              <div className="filters">
                <input
                  type="text"
                  placeholder="Фильтр по году обучения"
                  value={filters.classrooms.academicYear}
                  onChange={(e) => setFilters({
                    ...filters, 
                    classrooms: {
                      ...filters.classrooms, 
                      academicYear: e.target.value 
                    }
                  })}
                />
              </div>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ClassID</th>
                      <th>Название</th>
                      <th>Год обучения</th>
                      <th>Кабинет</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(classrooms, 'classrooms').map(cls => (
                      <tr key={cls.ClassID}>
                        <td>{cls.ClassID}</td>
                        <td>{cls.Name}</td>
                        <td>{cls.AcademicYear}</td>
                        <td>{cls.RoomNumber}</td>
                        <td className="actions">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit('class', cls.ClassID)}
                            disabled={isLoading}
                          >
                            <i className="fas fa-edit"></i> Редактировать
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(cls.ClassID, 'class')}
                            disabled={isLoading}
                          >
                            <i className="fas fa-trash"></i> Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination">
                <button 
                  onClick={() => fetchClassrooms(pagination.classrooms.page - 1)}
                  disabled={pagination.classrooms.page <= 1 || isLoading}
                >
                  Назад
                </button>
                <span>
                  Страница {pagination.classrooms.page} из {' '}
                  {Math.ceil(pagination.classrooms.total / pagination.classrooms.perPage)}
                </span>
                <button 
                  onClick={() => fetchClassrooms(pagination.classrooms.page + 1)}
                  disabled={
                    pagination.classrooms.page * pagination.classrooms.perPage >= 
                    pagination.classrooms.total || isLoading
                  }
                >
                  Вперед
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="table-section">
              <div className="section-header">
                <h2>Список предметов</h2>
                <div className="section-actions">
                  <button
                    className="add-btn"
                    onClick={() => handleAdd('subject')}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus"></i> Добавить
                  </button>
                </div>
              </div>
              <div className="filters">
                <input
                  type="text"
                  placeholder="Фильтр по учителю"
                  value={filters.subjects.teacher}
                  onChange={(e) => setFilters({
                    ...filters,
                    subjects: {
                      ...filters.subjects,
                      teacher: e.target.value
                    }
                  })}
                />
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Учитель</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData(subjects, 'subjects').map(subj => (
                      <tr key={subj.SubjectID}>
                        <td>{subj.SubjectID}</td>
                        <td>{subj.Name}</td>
                        <td>{subj.TeacherName}</td>
                        <td className="actions">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit('subject', subj.SubjectID)}
                            disabled={isLoading}
                          >
                            <i className="fas fa-edit"></i> Редактировать
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(subj.SubjectID, 'subject')}
                            disabled={isLoading}
                          >
                            <i className="fas fa-trash"></i> Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button
                  onClick={() => fetchSubjects(pagination.subjects.page - 1)}
                  disabled={pagination.subjects.page <= 1 || isLoading}
                >
                  Назад
                </button>
                <span>
                  Страница {pagination.subjects.page} из {' '}
                  {Math.ceil(pagination.subjects.total / pagination.subjects.perPage)}
                </span>
                <button
                  onClick={() => fetchSubjects(pagination.subjects.page + 1)}
                  disabled={
                    pagination.subjects.page * pagination.subjects.perPage >=
                    pagination.subjects.total || isLoading
                  }
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Подтверждение выхода</h2>
            <p>Вы уверены, что хотите выйти из системы?</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={cancelLogout}
              >
                Остаться
              </button>
              <button 
                className="confirm-btn"
                onClick={confirmLogout}
              >
                Да, выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button 
              className="close-modal" 
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              disabled={isLoading}
            >
              <i className="fas fa-times"></i>
            </button>
            
            <h2>
              {modalType === 'teacher' && 'Назначить учителя'}
              {modalType === 'edit_teacher' && 'Редактировать учителя'}
              {modalType === 'student' && 'Добавить ученика'}
              {modalType === 'edit_student' && 'Редактировать ученика'}
              {modalType === 'grades' && 'Добавить оценки'}
              {modalType === 'edit_grades' && 'Редактировать оценки'}
              {modalType === 'user' && 'Добавить пользователя'}
              {modalType === 'edit_user' && 'Редактировать пользователя'}
              {modalType === 'class' && 'Добавить класс'}
              {modalType === 'edit_class' && 'Редактировать класс'}
              {modalType === 'subject' && 'Добавить предмет'}
              {modalType === 'edit_subject' && 'Редактировать предмет'}
            </h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form 
              onSubmit={
                modalType.includes('user') ? handleUserSubmit : handleSubmit
              }
            >
              {(modalType === 'user' || modalType === 'edit_user') && (
                <>
                  <div className="form-group">
                    <label>Логин</label>
                    <input 
                      type="text" 
                      value={newUser.username}
                      onChange={(e) => setNewUser({
                        ...newUser, 
                        username: e.target.value
                      })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  {(modalType === 'user' || (modalType === 'edit_user' && newUser.password)) && (
                    <>
                      <div className="form-group">
                        <label>Пароль</label>
                        <input 
                          type="password" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({
                            ...newUser, 
                            password: e.target.value
                          })}
                          required={modalType === 'user'}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="form-group">
                        <label>Подтверждение пароля</label>
                        <input 
                          type="password" 
                          value={newUser.confirmPassword}
                          onChange={(e) => setNewUser({
                            ...newUser, 
                            confirmPassword: e.target.value
                          })}
                          required={modalType === 'user'}
                          disabled={isLoading}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="form-group">
                    <label>Роль</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({
                        ...newUser, 
                        role: e.target.value
                      })}
                      required
                      disabled={isLoading}
                    >
                      <option value="User">Пользователь</option>
                      <option value="Student">Ученик</option>
                      <option value="Teacher">Учитель</option>
                      <option value="Admin">Администратор</option>
                    </select>
                  </div>
                </>
              )}

              {(modalType === 'teacher' || modalType === 'edit_teacher') && (
                <>
                  <div className="form-group">
                    <label>Пользователь</label>
                    <select
                      value={newStudent.userId}
                      onChange={e => {
                        const selectedId = e.target.value;
                        setNewStudent({ 
                          ...newStudent, 
                          userId: selectedId,
                          userQuery: users.find(u => u.UserID === +selectedId)?.Username || ''
                        });
                        setSelectedUserId(selectedId); // <— вот сюда
                      }}
                      required
                      disabled={isLoading}
                    >
                      <option value="">— Выберите пользователя —</option>
                      {users
                        .filter(u => u.Role === 'Student')
                        .map(u => (
                          <option key={u.UserID} value={u.UserID}>
                            {u.Username} (ID={u.UserID})
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ФИО</label>
                    <input 
                      type="text" 
                      placeholder="Полное имя"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Кабинет</label>
                    <input 
                      type="number" 
                      placeholder="Номер кабинета"
                      value={classroomNumber}
                      onChange={(e) => setClassroomNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {(modalType === 'student' || modalType === 'edit_student') && (
                <>
                  <div className="form-group">
                    <label>Пользователь</label>
                    <select
                      value={newStudent.userId}
                      onChange={e => setNewStudent({ 
                        ...newStudent, 
                        userId: +e.target.value,
                        userQuery: users.find(u => u.UserID === +e.target.value)?.Username || ''
                      })}
                      required
                      disabled={isLoading}
                    >
                      <option value="">— Выберите пользователя —</option>
                      {users
                        .filter(u => u.Role === 'Student')
                        .map(u => (
                          <option key={u.UserID} value={u.UserID}>
                            {u.Username} (ID={u.UserID})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ФИО</label>
                    <input
                      type="text"
                      placeholder="Полное имя"
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Класс</label>
                    <select
                      value={newStudent.class}
                      onChange={e => setNewStudent({ ...newStudent, class: e.target.value })}
                      required
                      disabled={isLoading}
                    >
                      <option value="">Выберите класс</option>
                      {classrooms.map(cls => (
                        <option key={cls.ClassID} value={cls.Name}>
                          {cls.Name} ({cls.AcademicYear})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {(modalType === 'grades' || modalType === 'edit_grades') && (
                <>
                  <div className="form-group">
                    <label>Ученик</label>
                    <select
                      value={newGrades.student}
                      onChange={(e) => setNewGrades({
                        ...newGrades, 
                        student: e.target.value
                      })}
                      required
                      disabled={isLoading}
                    >
                      <option value="">Выберите ученика</option>
                      {students.map(student => (
                        <option key={student.id} value={student.fullName}>
                          {student.fullName} ({student.className})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grades-grid">
                    <div className="form-group">
                      <label>Математика</label>
                      <select
                        value={newGrades.subject1}
                        onChange={(e) => setNewGrades({
                          ...newGrades, 
                          subject1: e.target.value
                        })}
                        required
                        disabled={isLoading}
                      >
                        <option value="">Выберите оценку</option>
                        <option value="5">5 (Отлично)</option>
                        <option value="4">4 (Хорошо)</option>
                        <option value="3">3 (Удовлетворительно)</option>
                        <option value="2">2 (Неудовлетворительно)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Физика</label>
                      <select
                        value={newGrades.subject2}
                        onChange={(e) => setNewGrades({
                          ...newGrades, 
                          subject2: e.target.value
                        })}
                        required
                        disabled={isLoading}
                      >
                        <option value="">Выберите оценку</option>
                        <option value="5">5 (Отлично)</option>
                        <option value="4">4 (Хорошо)</option>
                        <option value="3">3 (Удовлетворительно)</option>
                        <option value="2">2 (Неудовлетворительно)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Литература</label>
                      <select
                        value={newGrades.subject3}
                        onChange={(e) => setNewGrades({
                          ...newGrades, 
                          subject3: e.target.value
                        })}
                        required
                        disabled={isLoading}
                      >
                        <option value="">Выберите оценку</option>
                        <option value="5">5 (Отлично)</option>
                        <option value="4">4 (Хорошо)</option>
                        <option value="3">3 (Удовлетворительно)</option>
                        <option value="2">2 (Неудовлетворительно)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {(modalType === 'class' || modalType === 'edit_class') && (
                <>
                  <div className="form-group">
                    <label>Название класса</label>
                    <input 
                      type="text" 
                      value={newClass.name}
                      onChange={(e) => setNewClass({
                        ...newClass, 
                        name: e.target.value
                      })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Год обучения</label>
                    <input 
                      type="number" 
                      value={newClass.academicYear}
                      onChange={(e) => setNewClass({
                        ...newClass, 
                        academicYear: e.target.value
                      })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Номер кабинета</label>
                    <input 
                      type="number" 
                      value={newClass.roomNumber}
                      onChange={(e) => setNewClass({
                        ...newClass, 
                        roomNumber: e.target.value
                      })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {(modalType === 'subject' || modalType === 'edit_subject') && (
                <>
                  <div className="form-group">
                    <label>Название предмета</label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Учитель</label>
                    <input
                      type="text"
                      value={newSubject.teacherQuery}
                      onChange={(e) => {
                        const selectedTeacher = teachers.find(t => t.FullName === e.target.value);
                        setNewSubject({
                          ...newSubject,
                          teacherQuery: e.target.value,
                          teacherId: selectedTeacher ? selectedTeacher.TeacherID : ''
                        });
                      }}
                      placeholder="Начните вводить ФИО..."
                      list="teacher-list"
                      required
                      disabled={isLoading}
                    />
                    <datalist id="teacher-list">
                      {teachers.map(t => (
                        <option key={t.TeacherID} value={t.FullName} data-id={t.TeacherID}/>
                      ))}
                    </datalist>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  disabled={isLoading}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Обработка...
                    </>
                  ) : modalType.startsWith('edit_') ? 'Сохранить изменения' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;