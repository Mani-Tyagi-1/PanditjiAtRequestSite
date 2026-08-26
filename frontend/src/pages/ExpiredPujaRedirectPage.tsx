import { Navigate, useLocation } from "react-router-dom";

const REPLACEMENT_PUJA_URL = "/vrindavan-banke-bihari-puja";

export default function ExpiredPujaRedirectPage() {
    const { pathname } = useLocation();
    const cameFromMahakaal = pathname.startsWith("/mahakaal-savan-somwar-puja");

    return (
        <Navigate
            to={REPLACEMENT_PUJA_URL}
            replace
            state={cameFromMahakaal ? { showMahakaalCompletionPopup: true } : undefined}
        />
    );
}
