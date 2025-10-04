import axios from 'axios'
import errorLogger from './errorLogger'

// Use relative URLs to use Vite proxy
// As rotas já têm /api no início, não precisamos adicionar base URL
const API_BASE_URL = ''

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add request interceptor to include token and track performance
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Adicionar timestamp para monitoramento de performance
    config.metadata = { startTime: Date.now() }
    
    return config
  },
  error => {
    errorLogger.logApiError(error, 'Request Interceptor', 'API Service');
    return Promise.reject(error)
  }
)

// Add response interceptor to handle errors and performance monitoring
api.interceptors.response.use(
  response => {
    // Monitorar performance da API
    const endTime = Date.now();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = endTime - startTime;
      errorLogger.monitorApiPerformance(response.config.url, startTime, endTime);
    }
    
    return response;
  },
  error => {
    // Capturar e logar erros de API
    const url = error.config?.url || 'URL desconhecida';
    const method = error.config?.method?.toUpperCase() || 'MÉTODO desconhecido';
    
    // Determinar o componente baseado na URL
    let component = 'API Service';
    if (url.includes('/materials')) component = 'Materiais';
    else if (url.includes('/stones')) component = 'Pedras';
    else if (url.includes('/jewelry')) component = 'Joias';
    else if (url.includes('/employees')) component = 'Funcionários';
    else if (url.includes('/customers')) component = 'Clientes';
    else if (url.includes('/vales')) component = 'Vales';
    else if (url.includes('/sizes')) component = 'Tamanhos';
    else if (url.includes('/entries')) component = 'Entradas';
    else if (url.includes('/login')) component = 'Login';
    
    // Logar o erro
    errorLogger.logApiError(error, `${method} ${url}`, component);
    
    return Promise.reject(error);
  }
)

// API service methods
const apiService = {
  // Auth
  login: (credentials) => api.post('/api/login', credentials),
  
  // Users
  getUsers: () => api.get('/api/users'),
  createUser: (user) => api.post('/api/users', user),
  updateUser: (id, user) => api.put(`/api/users/${id}`, user),
  deleteUser: (id) => api.delete(`/api/users/${id}`),

  // Employees
  getEmployees: () => api.get('/api/employees'),
  createEmployee: (employee) => api.post('/api/employees', employee),
  updateEmployee: (id, employee) => api.put(`/api/employees/${id}`, employee),
  deleteEmployee: (id) => api.delete(`/api/employees/${id}`),

  // Customers
  getCustomers: () => api.get('/api/customers'),
  createCustomer: (customer) => api.post('/api/customers', customer),
  updateCustomer: (id, customer) => api.put(`/api/customers/${id}`, customer),
  deleteCustomer: (id) => api.delete(`/api/customers/${id}`),

  // Vales
  getVales: () => api.get('/api/vales'),
  createVale: (vale) => api.post('/api/vales', vale),
  updateVale: (id, vale) => api.put(`/api/vales/${id}`, vale),
  deleteVale: (id) => api.delete(`/api/vales/${id}`),

  // Products/Jewelry
  getProducts: () => api.get("/api/jewelry"),
  createProduct: (product) => api.post("/api/jewelry", product),
  updateProduct: (id, product) => api.put(`/api/jewelry/${id}`, product),
  deleteProduct: (id) => api.delete(`/api/jewelry/${id}`),

  // Materials
  getMaterials: () => api.get("/api/materials"),
  createMaterial: (material) => api.post("/api/materials", material),
  updateMaterial: (id, material) => api.put(`/api/materials/${id}`, material),
  deleteMaterial: (id) => api.delete(`/api/materials/${id}`),

  // Stones
  getStones: () => api.get("/api/stones"),
  createStone: (stone) => api.post("/api/stones", stone),
  updateStone: (id, stone) => api.put(`/api/stones/${id}`, stone),
  deleteStone: (id) => api.delete(`/api/stones/${id}`),

  // Sizes
  getSizes: () => api.get("/api/sizes"),
  createSize: (size) => api.post("/api/sizes", size),
  updateSize: (id, size) => api.put(`/api/sizes/${id}`, size),
  deleteSize: (id) => api.delete(`/api/sizes/${id}`),

  // Entries
  getEntries: () => api.get("/api/entries"),
  createEntry: (entry) => api.post("/api/entries", entry),
  updateEntry: (id, entry) => api.put(`/api/entries/${id}`, entry),
  deleteEntry: (id) => api.delete(`/api/entries/${id}`),

  // Inventory
  getInventory: () => api.get('/api/inventory'),
  updateInventory: (id, data) => api.put(`/api/inventory/${id}`, data),

  // Sales
  getSales: () => api.get('/api/orders'),
  createSale: (sale) => api.post('/api/orders', sale),
  updateSale: (id, sale) => api.put(`/api/orders/${id}`, sale),
  deleteSale: (id) => api.delete(`/api/orders/${id}`),

  // IA Lua
  sendToLua: (message) => api.post('/api/lua', { message }),

  // Financial
  getFinancialData: () => api.get('/api/financial/dashboard'),
  getTransactions: () => api.get('/api/financial/transactions'),
  
  // Reports
  getReports: (type) => api.get(`/api/reports/${type}`),

  // Costs
  getCosts: () => api.get('/api/costs'),
  createCost: (cost) => api.post('/api/costs', cost),
  updateCost: (id, cost) => api.put(`/api/costs/${id}`, cost),
  deleteCost: (id) => api.delete(`/api/costs/${id}`),

  // Discounts
  getDiscounts: () => api.get('/api/discounts'),
  createDiscount: (discount) => api.post('/api/discounts', discount),
  updateDiscount: (id, discount) => api.put(`/api/discounts/${id}`, discount),
  deleteDiscount: (id) => api.delete(`/api/discounts/${id}`),

  // Payroll
  getPayroll: () => api.get('/api/payroll'),
  createPayroll: (payroll) => api.post('/api/payroll', payroll),
  updatePayroll: (id, payroll) => api.put(`/api/payroll/${id}`, payroll),
  deletePayroll: (id) => api.delete(`/api/payroll/${id}`),
}

export default apiService