const Joi = require("joi");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{6,}$/;
const passwordErrorMsg = `Should contain atleast a capital letter, atleast a small letter, atleast a number, atleast a special character, And minimum length 6`;

const userRegisterSchema = Joi.object({
  name: Joi.string().min(3).max(300).required("Name required!"),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
  password: Joi.string()
    .regex(passwordRegex)
    .message(`Invalid password, please ensure :- ${passwordErrorMsg}`)
    .required(),
});

const userSigninSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
    .required(),
  password: Joi.string()
    .regex(passwordRegex)
    .message(`Invalid password, please ensure :- ${passwordErrorMsg}`)
    .required(),
});

module.exports = { userRegisterSchema, userSigninSchema };
