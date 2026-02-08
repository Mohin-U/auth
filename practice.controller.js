import User from "./model/User.model.js";
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendVerificationEmail } from "./utils/sendingMail.utils.js";

// register route
const register = async ( req, res ) => {
    // 1.get the data from user
    const {name, email, password} = req.body

    // 2.validate if user data has arrived
    if (!name || !email || password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    // password validation
    if (password.length < 6 ) {
        return res.status(400).json({
            success: false,
            message: "password must be at least six characters long"
        })
    }

    try {
        // 3.Check if the user is exists 
    const existinguser = await User.findOne({ email })
    if (existinguser) {
        return res.status(400).json({
            success: false,
            message: "User is already exists"
        })
    }

    // 4.Hashing of password is done in User model using pre-save hook middleware

    // 5.generate randomBytes(token)
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = Date.now() + 10 * 60 * 1000

    // 6.now create a new user
    const user = await User.create({
        name,
        email,
        password,
        verificationToken: token,
        verificationTokenExpiry: tokenExpiry
    })

    // 8. check if user is created
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User registration failed"
        })
    }

    // 9. verify the user's email address by sending the token to the user's email 
    await sendVerificationEmail(user.email, user.verificationToken)

    // 10. send response
    res.status(201).json({
        success: true,
        message: "User registered successfully. please verify your email address",
        user: {
            id: user._id,
            name: user.email,
            email: user.email,
            isVerified: user.isVerified
        }

    })
    
    } catch (error) {
        console.error("Error", error.message)
        return res.status(500).json({
            success: false,
            message: "Internal server Error"
        })
    }
}

const verify = async ( req, res ) => {
    try {
        // 1. get verification token from request params means url
        const token = req.params.token

        // 2. find the user with the verification token in DB
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: Date.now()}
        })
        
        // 3. check if user exists
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            })
        }

        // 4. update user isVerified status and remove verification token and then save the user in DB
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined

        await user.save()

        // 5. Send response
            return res.status(200).json({
                success: true,
                message: "Email verified successfully"
            })

    } catch (error) {
        console.error("Error", error.message)
        return res.status(500).json({
            success: false,
            message: "Internal server Error"
        })
    }
}

const login = async ( req, res ) => {
    // 1. get the data from req.body
    const {email, password} = req.body

    // 2. validate the user data
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

   try {
    // 3. check if user exists in DB with the provided email
    const user = await User.findOne({email})

    // 4. check if user exists
    if (!user) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        })
    }

    // 5.check if user is verified
    if (!user.isVerified) {
        return res.status(400).json({
            success: false,
            message: "Please verify your email address"
        })
    }

    // 6. compare the password
    const isPasswordMatch = await user.comparePassword (password)

    // 7. check if password is correct
    if (!isPasswordMatch) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        })
    }

    // 8. create a JWT token for the user to access to protected routes
    const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })

    const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
    user.refreshToken = refreshToken

    await user.save()

    // 9. set cookie
    const cookieOptions = {
        httpOnly: true
    }

    res.cookie("accessToken", accessToken, cookieOptions)
    res.cookie("refreshToken", refreshToken, cookieOptions)

    // 10. send response
        return res.status(200).json({
            success: true,
            message: "user logged in successfully"
        })
   } catch (error) {
    console.error("User login failed", error)
        return res.status(500).json({
            success: false,
            message: "user login failed"
        })
   }
}

const getProfile = async (req, res) => {
   try {
     // 1. get user id from request object
    const userId = req.user.id

    // 2. find user by id
    const user = await User.findOne(userId).select("-password")

    // 3. check if user exists
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User is not found"
            })
        }
        //  4. Send response
        return res.status(200).json({
            success: true,
            message:"User profile fetched successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role,
            }
        })
   } catch (error) {
    console.error("Error getting user profile", error.message)
    return res.status(500).json({
        success: false,
        message: "Error getting user profile"
    })
   }
}

const logout = async (req, res) => {
    // 1. take the refreshToken from cookies
    const token = req.cookies.refreshToken

    // 2. check if token is there
    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Unauthorized access"
        })
    }

    try {
        // 3. verify the refreshToken
        const refreshDecoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        
        // 4. find the user based on token
        const user = await User.findOne({_id: refreshDecoded.id})

        // 5. check if user is exists
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Unauthorized access"
            })
        }

        // 6. if exists user then set the user refreshToken null and save the user
        user.refreshToken = null
        await user.save()

        // 7. clear both cookie
        res.cookie("accessToken", "", {httpOnly: true})
        res.cookie("refreshToken", "", {httpOnly: true})

        // 8. send response
        return res.status(200).json({
            success: true,
            message: "user logged out successfully"
        })
    } catch (error) {
        console.error("User logout failed", error.message)
        return res.status(500).json({
            success: false,
            message: "User logout failed"
        })
    }
}

const myLogout = async (req, res) => {
    // 1. take the token from cookies
    const token = req.cookies.refreshToken

    // 2. check if token exists
    if (!token) {
        return res.status(400).json({
            success: true,
            messa: "Unauthorized access"
        })
    }

    try {
        // 3. verify the token 
        const refreshDecoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

        // 4. find the user based on token
        const user = await User.findOne({_id: refreshDecoded.id})

        // 5. check if user exists by that token
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Unauthorized access"
            })
        }

        // 6. set the refreshToken null and save that user into DB
        user.refreshToken = null
        await user.save()

        // 7. clear both token
        res.cookie("accessToken", "", {httpOnly: true})
        res.cookie("refreshToken", "", {httpOnly: true})

        // 8. send response
        return res.status(200).json({
            success: false,
            message: "User logged Out successfully"
        })
    } catch (error) {
        console.error("user logout failed", error.message)
        return res.status(500).json({
            success: false,
            message: "user logout failed"
        })
    }
}

