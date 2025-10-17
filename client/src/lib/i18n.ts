export const translations = {
  en: {
    signIn: "Sign In",
    signUp: "Sign Up",
    welcomeBack: "Welcome Back",
    signInToAccount: "Sign in to your account",
    dontHaveAccount: "Don't have an account?",
    resetPassword: "Reset Password"
  },
  hi: {
    signIn: "साइन इन",
    signUp: "साइन अप",
    welcomeBack: "वापसी पर स्वागत है",
    signInToAccount: "अपने खाते में साइन इन करें",
    dontHaveAccount: "खाता नहीं है?",
    resetPassword: "पासवर्ड रीसेट करें"
  }
};

let currentLang = 'en';
export const setLang = (l: string) => { currentLang = l; };
export const t = (key: string) => {
  return (translations as any)[currentLang][key] || (translations as any)['en'][key] || key;
};
export const getLang = () => currentLang;
