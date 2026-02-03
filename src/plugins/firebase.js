import { initializeApp } from "firebase/app"
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

import firebaseConfig from "../config/firebase"

const app = initializeApp(firebaseConfig)

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Lc4Dl8sAAAAAM-NW8Ose8cBBY_2T30tH8cIqwMl'),

  // Met à jour le token automatiquement en arrière-plan
  isTokenAutoRefreshEnabled: true 
});
export default app
