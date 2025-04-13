import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import AuthLayout from "./AuthLayout";
import FormInput from "../../components/FormInput";
import { register } from "../../services/auth";

const SignupSchema = Yup.object().shape({
  username: Yup.string().min(3, "Too short!").required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Too short!").required("Required"),
});

export default function Signup() {
  const dispatch = useDispatch();

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const data = await register(values);
      dispatch(setCredentials(data));
    } catch (error) {
      setErrors({ email: error.response?.data?.error || "Signup failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Get started with Connectify"
      linkText="Already have an account? Login"
      linkPath="/login"
    >
      <Formik
        initialValues={{ username: "", email: "", password: "" }}
        validationSchema={SignupSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput name="username" label="Username" />
            <FormInput name="email" type="email" label="Email" />
            <FormInput name="password" type="password" label="Password" />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full neumorphic-inset py-2 px-4 rounded-lg hover:bg-gray-200 transition"
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}
      </Formik>
    </AuthLayout>
  );
}
