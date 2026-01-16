import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: number;
  dueDate: string;
  amountInCents: number;
  status: string;
  student?: {
    name: string;
    registrationNumber: string;
  };
  paidAt?: string;
  paymentMethod?: string;
}

interface PaymentCalendarProps {
  payments: Payment[];
  onDateClick?: (date: Date, payments: Payment[]) => void;
}

export function PaymentCalendar({ payments, onDateClick }: PaymentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getPaymentsForDate = (date: Date) => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.dueDate);
      return (
        paymentDate.getDate() === date.getDate() &&
        paymentDate.getMonth() === date.getMonth() &&
        paymentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 hover:bg-green-200 border-green-300";
      case "pending":
        return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300";
      case "overdue":
        return "bg-red-100 hover:bg-red-200 border-red-300";
      default:
        return "bg-gray-100 hover:bg-gray-200 border-gray-300";
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border border-transparent" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayPayments = getPaymentsForDate(date);
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      // Group payments by status
      const paidCount = dayPayments.filter(p => p.status === "paid").length;
      const pendingCount = dayPayments.filter(p => p.status === "pending").length;
      const overdueCount = dayPayments.filter(p => p.status === "overdue").length;

      days.push(
        <div
          key={day}
          className={`p-2 border border-gray-200 min-h-[80px] cursor-pointer hover:bg-accent transition-colors ${
            isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => onDateClick?.(date, dayPayments)}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-600" : ""}`}>
            {day}
          </div>
          {dayPayments.length > 0 && (
            <div className="space-y-1">
              {paidCount > 0 && (
                <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded flex items-center justify-between">
                  <span>Pago</span>
                  <span className="font-semibold">{paidCount}</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded flex items-center justify-between">
                  <span>Pendente</span>
                  <span className="font-semibold">{pendingCount}</span>
                </div>
              )}
              {overdueCount > 0 && (
                <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded flex items-center justify-between">
                  <span>Atrasado</span>
                  <span className="font-semibold">{overdueCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const totalPayments = payments.filter(p => {
    const paymentDate = new Date(p.dueDate);
    return (
      paymentDate.getMonth() === currentMonth.getMonth() &&
      paymentDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const totalAmount = totalPayments.reduce((sum, p) => sum + p.amountInCents, 0);
  const paidAmount = totalPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amountInCents, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendário de Mensalidades
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-[180px] text-center font-semibold">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-sm">Pago: {totalPayments.filter(p => p.status === "paid").length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span className="text-sm">Pendente: {totalPayments.filter(p => p.status === "pending").length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-sm">Atrasado: {totalPayments.filter(p => p.status === "overdue").length}</span>
          </div>
          <div className="ml-auto flex gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">R$ {(totalAmount / 100).toFixed(2)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Recebido: </span>
              <span className="font-semibold text-green-600">R$ {(paidAmount / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {/* Days of week header */}
          {daysOfWeek.map(day => (
            <div
              key={day}
              className="p-2 text-center font-semibold bg-muted text-sm border-b border-gray-200"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {renderCalendarDays()}
        </div>
      </CardContent>
    </Card>
  );
}
