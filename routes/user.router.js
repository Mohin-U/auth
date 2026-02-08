import express from 'express'
const router = express.Router()
import { 
    getProfile,
    login, 
    logout, 
    register, 
    verify 
} from '../controller/user.controller.js';

import isLoggedIn from '../middlewares/isLoggedIn.middleware.js';


router.post('/register', register)
router.get('/verify/:token', verify)
router.post('/login', login)
router.get('/get-profile', isLoggedIn, getProfile)
router.post('/logout', isLoggedIn, logout)
export default router;