import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import AuthLayout from "./AuthLayout";
import FormInput from "../../components/FormInput";
import { login } from "../../services/auth";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Too short!").required("Required"),
});

export default function Login() {
  const dispatch = useDispatch();

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const data = await login(values);
      dispatch(setCredentials(data));
    } catch (error) {
      setErrors({ email: " ", password: "Invalid credentials" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue"
      linkText="Don't have an account? Sign up"
      linkPath="/signup"
    >
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput name="email" type="email" label="Email" />
            <FormInput name="password" type="password" label="Password" />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full neumorphic-inset py-2 px-4 rounded-lg hover:bg-gray-200 transition"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
        )}
      </Formik>
    </AuthLayout>
  );
}
