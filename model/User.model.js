import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minLength: 6
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        verificationToken: String,
        verificationTokenExpiry: Date,
        resetPasswordToken: String,
        resetPasswordTokenExpiry: Date,
        refreshToken: String,
    },
    {timestamps: true}
);

// use pre-save hook middleware to hash the password before saving the user in DB
// userSchema.pre("save", async function (next) {
//     if (!this.isModified("password")){
//         next()
//     }else{
//         this.password = await bcrypt.hash(this.password, 10);
//         next()
//     }
// })

userSchema.pre("save", async function(){
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    
   
})

// compare password
userSchema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password)
}










const User = mongoose.model("User",userSchema)
export default User;