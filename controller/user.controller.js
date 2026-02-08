import User from '../model/User.model.js'
import crypto from 'crypto'
import { sendVerificationEmail } from '../utils/sendingMail.utils.js';
import jwt from 'jsonwebtoken'
// register route
// when i take data from url we will use "get" method but when we take from body we will use post "method".
const register = async (req, res) => {
    // 1. get user data from req.body
    const {name, email, password} = req.body
    console.log(name, email, password)

    // 2. validate the inputs
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
            
        });
    };

    // password validation
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 character long ",
        });
    };

    try {
        // 3. Check if user already exists in DB
        const existinguser = await User.findOne({email});
        if (existinguser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }
        

        // 4. Hashing of password is done in the User model using pre-save hook middleware.

        // 5. generate a verification token and expiry time
        const token = crypto.randomBytes(32).toString('hex')
        console.log("Token", token)
        const tokenExpiry = Date.now() + 10 * 60 * 1000;
        console.log("tokenExpiry:", tokenExpiry)
        // 6. now create a new user
        const user = await User.create({
            name,
            email,
            password,
            verificationToken: token,
            verificationTokenExpiry: tokenExpiry
        })
        console.log(user)
        // 7. check if user is created
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User registration failed"
            })
        }
        console.log(user)

        // 8. verify the user email address by sending a token to the user's email address
        await sendVerificationEmail(user.email, user.verificationToken)
        
        // 9. send response
        return res.status(201).json({
            success: true,
            message: "User registered successfully, please verify your email address",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            },
        });
    } catch (error) {
        console.error("User registration failed", error)
        return res.status(500).json({
            success: false,
            message: "User registration failed",
        });
    }
}

// Verify user email address controller
const verify = async (req, res) => {
    try {
        // 1. get verification token from request params means url
        const token = req.params.token;

        // 2. find the user with the verification token in DB
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: {$gt: Date.now()},
            });
        console.log(user)
            // 3. check if user exists
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired verification token"
                })
            }

            // 4. update user isVerified status and remove verification token.
            user.isVerified = true;
            user.verificationToken = undefined;
            user.verificationTokenExpiry = undefined;
            await user.save()

            // 5. Send response
            return res.status(200).json({
                success: true,
                message: "Email verified successfully"
            })
    } catch (error) {
        console.error("Email verification failed", error)
        return res.status(500).json({
            success: false,
            message: "Email verification failed"
        })
    }
}

// Login user controller
const login = async (req, res) => {
    // 1. get user data from request body
    const {email, password} = req.body
    console.log(email, password)

    // 2. validate the inputs 
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    try {
        // 3. check if user exists in DB with the provided email
        const user = await User.findOne({ email })

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
        const isPasswordMatch = await user.comparePassword(password)

        // 7. check if password is correct
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            })
        }

        // 8. create a JWT token for the user to access to protected routes
        // const jwtToken = jwt.sign({ id: user._id}, process.env.JWT_SECRET, {
        //     expiresIn: process.env.JWT_EXPIRY,
        // })
        const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        })

        const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        })

        user.refreshToken = refreshToken

        await user.save();
        // 9. set cookie
        // const cookieOptions = {
        //     httpOnly: true,
        //     expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        // }
        const cookieOptions = {
            httpOnly: true,
        }

        // res.cookie("jwtToken",jwtToken, cookieOptions)
        res.cookie("accessToken", accessToken, cookieOptions);
        res.cookie("refreshToken", refreshToken, cookieOptions);

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

// get user profile controller
const getProfile = async (req, res) => {
    try {
        // 1. get user id from request object
        const userId = req.user.id;

        // 2. find user by id
        const user = await User.findById(userId).select("-password")

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
        console.error("Error getting user profile", error)
        return res.status(500).json({
            success: false,
            message: "Error getting user profile"
        })
    }
}

// logout user controller
const logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    // console.log("Refresh Token from cookie:", token)
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access"
        })
    }
    try {
        // 1. check if user is logged in
        // if (!req.user) {
        //     return res.status(401).json({
        //         success: false,
        //         message: "Unauthorized access"
        //     })
        // }

        const refreshDecoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findOne({_id: refreshDecoded.id})

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            })
        }
        
        user.refreshToken=null
        await user.save()
        // 2. clear cookie
        // res.cookie("jwtToken", "", {
        //     expires: new Date(Date.now()), //set the cookie to expire immediately after logout.
        //     httpOnly: true,
        // })

        res.cookie("accessToken", "", {
            httpOnly: true
        });
        res.cookie("refreshToken", "", {
            httpOnly: true
        })

        // 3. send response
        return res.status(200).json({
            success: true,
            message: "User logged out successfully"
        })
    } catch (error) {
        console.error("User logout failed", error)
        return res.status(500).json({
            success: false,
            message: "User logout failed"
        })
    }
}
export {register, verify, login, getProfile, logout}