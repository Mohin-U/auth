# Essential commands for notes:
1. hash symbol(#) for headings
2. paragraph and line breaks(two spaces for line break).
3. Emphasis  
3.1: italics: (*text*) or (_text_)  
3.2: bold: (**text**) or (__text__)  
3.3: bold and italics: (***text***) or (___text___)
4. lists  
4.1: Unordered lists: (-/*/+) followed by a space  
4.2: Ordered lists: number and period + space.  
4.3: Nested lists: more than 2 space then enter.
5. Links:
6. Blackquotes: User greater-than sign (>).
 > This is an example of blackquotes.

7. Code: Format code snippet to make them readable.  
7.1: Inline `console.log("Hello")`  
7.2: Code blocks ```javascript  
function sayHello(){  
    console.log('Hello") 
}```

- What is User model?why we need it?  
=> When we go on a website, that website ask us to give information them, to create our identity on their server.To store those information at first we need to create a model. 
- What is token?  
=> We use token to verify something.the authentication tokens used in web security, which are typically temporary


- Write the algorithm for register route?  
=> get user data from req.body.  
=> validate the inputs.  
=> password validation.  
=> check if user already exists in DB.  
=> hashing the password.  
=> generate a verification token and expiry time for that token.  
=> now check if user is created.  
=> check if user is created.  
=> verify the user email address by sending a token to the user's email address.  
=> send response.  

- write the algorithm for verify route?  
=> get verification token from request params means from url.  
=> find the user with the verification token in DB.  
=> check if user exists.  
=> update user isVerified status and remove verification token.  
=> send response.  

- How to hash password?  
1. Use async/wait recommended:-> ```javascript // file: User.model.js (line 54)
userSchema.pre('save', async function() {
  // Use 'this' to access the document
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  // No next() call needed
});```  
2. Use the **next** callback traditional:-> Remove the **async** keyword and use the **next** callback to signal completion. ``` Javascript
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next(); // Manual signal
  });
});```  

- Key rules for mongoose hooks:->  
1. Arrow Functions: Do not use () => {} if you need to access the document via this. Arrow functions do not bind their own this.  
2. Error Handling: In an async hook, throw an error to stop the save process. In a callback hook, pass the error to next(error).  
3. Version Note: As of January 2026, Mongoose 9.x strictly follows Promise-based middleware for all async definitions. mongoose can detect automatically if it is async function or not.

