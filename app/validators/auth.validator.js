export const validateUserFields = (data) => {
  const errors = [];
  
  if (!data.name) errors.push("Name is required");
  else if (data.name.length < 3) errors.push("Name must be at least 3 characters");

  if (!data.email) errors.push("Email is required");
  else if (!/\S+@\S+\.\S+/.test(data.email)) errors.push("Email is invalid");

  if (!data.password) errors.push("Password is required");
  else if (data.password.length < 6) errors.push("Password must be at least 6 characters");

  if (data.role && !["admin", "employee"].includes(data.role)) {
    errors.push("Role must be admin or employee");
  }

  return errors;
};

export const validateLoginFields = (data) =>{
  const errors = [];
  if (!data.email || typeof data.email !== "string" ){
    errors.push("Valid email is required");
  }
  if (!data.password || typeof data.password !== "string" ){
    errors.push("Password is required");
  }
  return errors;
};
export const validateForgetPassword = (data)=>{
    const errors = [];
    if (!data.email){
        errors.push("Email is required");
    }else if(!/\S+@\S+\.\S+/.test(data.email)){
        errors.push("Email is invalid");
    }

    return errors;

};
// auth.validator.js

// Reset Password validation
export const validateResetPassword = ({ password, confirmPassword }) => {
  const errors = [];

  if (!password || password.trim() === "") {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (!confirmPassword || confirmPassword.trim() === "") {
    errors.push("Confirm Password is required");
  }

  if (password && confirmPassword && password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return errors; 
};

