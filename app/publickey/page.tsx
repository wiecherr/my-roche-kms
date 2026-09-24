// src/app/rfid/page.tsx
import TagForm from './TagForm';



export default function GenerateDerivedPublicKeyPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">KMS Derived Public Keys Management</h1>
        <p className="text-gray-500 mt-2">Create new derived public key (HSM)</p>
      </div>
      
      {/* Unser Formular einbinden */}
      <TagForm />
    </div>
  );
}