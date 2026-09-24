// src/app/rfid/page.tsx
import TagForm from './TagForm';



export default function GenerateMasterKeyPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">KMS Private Global Master Key Management</h1>
        <p className="text-gray-500 mt-2">Create new Private Global Master Keys (HSM)</p>
      </div>
      
      {/* Unser Formular einbinden */}
      <TagForm />
    </div>
  );
}