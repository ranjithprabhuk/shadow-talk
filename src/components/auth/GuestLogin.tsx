import { useForm } from 'react-hook-form';
import { useUserStore } from '@/store/userStore';
import { User } from '@/types';
import { Button, Input, Select } from '@/components/ui';

interface LoginForm {
  name: string;
  gender: User['gender'];
  age: number;
}

const genderOptions = [
  { value: '', label: 'Select gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

export const GuestLogin = () => {
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = (data: LoginForm) => {
    // Generate unique peer ID
    const peerId = `peer-${Date.now()}-${crypto.randomUUID()}`;

    const user: User = {
      peerId,
      name: data.name,
      gender: data.gender,
      age: data.age,
      isOnline: true,
      showAge: true,
      showGender: true,
      connectionQuality: 'excellent',
    };

    setCurrentUser(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600 px-4">
      <div className="card w-full max-w-md p-8 shadow-2xl">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ShadowTalk
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join as a guest to start chatting
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Input */}
          <Input
            label="Name"
            placeholder="Enter your name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 3,
                message: 'Name must be at least 3 characters',
              },
              maxLength: {
                value: 20,
                message: 'Name must be less than 20 characters',
              },
              pattern: {
                value: /^[a-zA-Z0-9\s]+$/,
                message: 'Name can only contain letters, numbers, and spaces',
              },
            })}
          />

          {/* Gender Select */}
          <Select
            label="Gender"
            options={genderOptions}
            error={errors.gender?.message}
            {...register('gender', {
              required: 'Please select a gender',
            })}
          />

          {/* Age Input */}
          <Input
            label="Age"
            type="number"
            placeholder="Enter your age"
            error={errors.age?.message}
            {...register('age', {
              required: 'Age is required',
              valueAsNumber: true,
              min: {
                value: 13,
                message: 'You must be at least 13 years old',
              },
              max: {
                value: 99,
                message: 'Age must be less than 100',
              },
            })}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Joining...' : 'Join Chat'}
          </Button>
        </form>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          No registration required. Your data is stored locally and never sent to any server.
        </p>
      </div>
    </div>
  );
};
