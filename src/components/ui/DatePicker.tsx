import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function CustomDatePicker({
    label,
    value,
    onChange,
    isEditing,
}: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    isEditing: boolean;
    outline?: boolean;
}) {
    const dateValue = value ? new Date(value) : null;

    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
            </label>

            {isEditing ? (
                <div className="w-full">
                    <DatePicker
                        selected={dateValue}
                        onChange={(date) => onChange(date ? date.toISOString() : '')}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="dd/mm/yyyy"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                        wrapperClassName="w-full block"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={80}
                    />
                </div>
            ) : (
                <input
                    type="text"
                    value={
                        dateValue
                            ? dateValue.toLocaleDateString('en-GB') // -> DD/MM/YYYY
                            : ''
                    }
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-700"
                />
            )}
        </div>
    );
}
