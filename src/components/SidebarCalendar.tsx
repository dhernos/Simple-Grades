'use client';

import { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { de, enGB, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ThemeToggle from './theme-toggle';
// NEUER Import für ein Icon
import { Trash2 } from 'lucide-react';

interface Appointment {
    id: string;
    title: string;
    date: string;
}

export function SidebarCalendar() {
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
    const [newAppointmentTitle, setNewAppointmentTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Filtert die Termine für den ausgewählten Tag
    const appointmentsForSelectedDay = allAppointments.filter(appt =>
        isSameDay(new Date(appt.date), selectedDay || new Date())
    );

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // API-Aufrufe parallel ausführen
            const [allRes, upcomingRes] = await Promise.all([
                fetch('/api/appointments?all=true'),
                fetch('/api/appointments?upcoming=true'),
            ]);

            if (allRes.ok) {
                const data = await allRes.json();
                setAllAppointments(data);
            }
            if (upcomingRes.ok) {
                const data = await upcomingRes.json();
                setUpcomingAppointments(data);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            toast.error('Termine konnten nicht geladen werden.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // NEUE Funktion zum Löschen eines Termins
    const handleDeleteAppointment = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/appointments?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Termin erfolgreich gelöscht!');
                fetchData(); // Termine neu laden
            } else {
                toast.error('Fehler beim Löschen des Termins.');
            }
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            toast.error('Fehler beim Löschen des Termins.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppointmentTitle || !selectedDay) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newAppointmentTitle,
                    date: new Date(selectedDay.setHours(12, 0, 0, 0)).toISOString(),
                }),
            });

            if (res.ok) {
                toast.success('Termin erfolgreich erstellt!');
                setNewAppointmentTitle('');
                fetchData(); // Termine neu laden
            } else {
                toast.error('Fehler beim Erstellen des Termins.');
            }
        } catch (error) {
            console.error('Failed to add appointment:', error);
            toast.error('Fehler beim Erstellen des Termins.');
        } finally {
            setIsLoading(false);
        }
    };

    const modifiers = {
        event: allAppointments.map(appt => new Date(appt.date)),
    };

    return (
        <div className="p-4 space-y-4">
            {/* Kalender */}
            <h3 className="text-xl font-semibold">Calendar</h3>
            <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                initialFocus
                locale={enGB}
                modifiers={modifiers}
            />

            <div className="border-t pt-4">
                {selectedDay && (
                    <>

                        {/* Formular zum Hinzufügen von Terminen */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal mb-4">
                                    + Add appointment
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-4 space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={newAppointmentTitle}
                                    onChange={(e) => setNewAppointmentTitle(e.target.value)}
                                    placeholder="Termintitel eingeben"
                                />
                                <Button onClick={handleAddAppointment} className="w-full" disabled={isLoading}>
                                    Add
                                </Button>
                            </PopoverContent>
                        </Popover>

                        {/* Liste der Termine für den ausgewählten Tag (ohne Uhrzeit) */}
                        {isLoading ? (
                            <p>Loading appointments...</p>
                        ) : appointmentsForSelectedDay.length > 0 ? (
                            <ul className="space-y-2">
                                {appointmentsForSelectedDay.map((appt) => (
                                    <li key={appt.id} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex justify-between items-center">
                                        <p className="font-medium">{appt.title}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAppointment(appt.id)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No appointments for this day.</p>
                        )}
                    </>
                )}
            </div>
            <div className="border-t pt-4">
                {/* Liste der nächsten 5 Termine */}
                <h4 className="text-lg font-bold mt-6 pb-4">Your next appointments:</h4>
                {isLoading ? (
                    <p>Loading appointments...</p>
                ) : upcomingAppointments.length > 0 ? (
                    <ul className="space-y-2">
                        {upcomingAppointments.map((appt) => (
                            <li key={appt.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{appt.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {format(new Date(appt.date), 'dd.MM.yyyy', { locale: de })}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAppointment(appt.id)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No future appointments.</p>
                )}
            </div>
            <div className="fixed bottom-5 left-5">
                <ThemeToggle />
            </div>
        </div>
    );
}