import { Navigate, useSearchParams } from "react-router-dom";

// Register page now redirects to the unified login flow
export default function Register() {
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect") || "/";
    return <Navigate to={`/login${redirect !== "/" ? `?redirect=${redirect}` : ""}`} replace />;
}
