import jwt from 'jsonwebtoken'
import User from "../model/User.model.js"
const isLoggedIn = async (req, res, next) => {
    try {
        // 1. extract token from request of the user API call (from cookies)
        // const token = req.cookies.jwtToken;
        const accessToken = req.cookies.accessToken
        const refreshToken = req.cookies.refreshToken
        // sbse pehle check kro Access token-> direct login -> naye refresh & acces token generate krdo
        //check access nhi h....refressh check -> naya access or refress dedo
        // dono nhi h_> user se bolo login kre

        // 2. check if token exists
        // if (!token) {
        //     return res.status(401).json({
        //         success: false,
        //         message: "Unauthorized access"
        //     })
        // }
        if (!accessToken) {
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access"
                })
            }

            // 3. verify the token
            // const decoded = jwt.verify(token, process.env.JWT_SECRET)

            // Refresh token hain
            const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
            console.log(refreshDecoded.id)

            // 4. check if user exists
            // if (!decoded) {
            //     return res.status(401).json({
            //         success: false,
            //         message: "Unauthorized access"
            //     })
            // }

            // 5. pass the user data to the next middleware
            // req.user = decoded

            const user = await User.findOne({ _id: refreshDecoded.id })
            console.log(user.email)

            if (!user)
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized access"
                })

            const newAccessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            })
            const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            })

            user.refreshToken = newRefreshToken
            await user.save()

            const cookieOptions = {
                httpOnly: true
            }

            res.cookie("accessToken", newAccessToken, cookieOptions)
            res.cookie("refreshToken", newRefreshToken, cookieOptions)
            req.user = refreshDecoded

            next()
        } else {

            const accessDecoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

            const user = await User.findOne({ _id: accessDecoded.id });
            if (!user) {
                return res.status(401).json({
                    status: false,
                    message: "Unauthorized access",
                });
            }


            const newAccessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            });
            const newRefreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            });

            user.refreshToken = newRefreshToken;
            await user.save();

            const cookieOptions = {
                httpOnly: true,
            };

            res.cookie("accessToken", newAccessToken, cookieOptions);
            res.cookie("refreshToken", newRefreshToken, cookieOptions);
            req.user = accessDecoded;
            next();
        }
    } catch (error) {

        console.error("Error verifying token: ", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export default isLoggedIn;
// sbse pehle check kro Access token-> direct login -> naye refresh & acces token generate krdo
//check access nhi h....refressh check -> naya access or refress dedo
// dono nhi h_> user se bolo login kre

