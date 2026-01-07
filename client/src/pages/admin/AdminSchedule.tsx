import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  User,
  Trash2,
  Edit,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useGym } from "@/_core/hooks/useGym";

const DAYS_MAP: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function AdminSchedule() {
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [dayFilter, setDayFilter] = useState<string>("all");

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    type: "",
    dayOfWeek: "monday",
    startTime: "",
    durationMinutes: 60,
    capacity: 20,
    professorId: "",
  });

  const [bookingForm, setBookingForm] = useState({
    studentId: "",
    bookingDate: new Date().toISOString().split('T')[0],
  });

  const [bookingType, setBookingType] = useState<"student" | "visitor">("student");
  const [visitorForm, setVisitorForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { gymSlug } = useGym();

  // Queries
  const { data: schedules, refetch: refetchSchedules } = trpc.schedules.list.useQuery({} as any, {
    retry: false,
    onError: (error) => {
      console.error("Erro ao carregar horários:", error.message);
    },
  });

  const { data: professors } = trpc.professors.list.useQuery({ gymSlug }, {
    enabled: !!gymSlug,
    retry: false,
    onError: (error) => {
      console.error("Erro ao carregar professores:", error.message);
    },
  });

  const { data: students } = trpc.students.listAll.useQuery(
    { gymSlug: gymSlug || '' },
    {
      enabled: !!gymSlug,
      retry: false,
      onError: (error) => {
        console.error("Erro ao carregar alunos:", error.message);
      },
    }
  );

  const { data: leads } = trpc.leads.list.useQuery({}, {
    retry: false,
    onError: (error) => {
      console.error("Erro ao carregar leads:", error.message);
    },
  });

  const { data: bookings, refetch: refetchBookings } = trpc.bookings.listBySchedule.useQuery(
    { scheduleId: selectedSchedule?.id || 0, bookingDate: bookingForm.bookingDate },
    {
      enabled: !!selectedSchedule,
      retry: false,
      onError: (error) => {
        console.error("Erro ao carregar agendamentos:", error.message);
      },
    }
  );

  const { data: visitorBookings, refetch: refetchVisitorBookings } = trpc.visitorBookings.listBySchedule.useQuery(
    { scheduleId: selectedSchedule?.id || 0, bookingDate: bookingForm.bookingDate },
    {
      enabled: !!selectedSchedule,
      retry: false,
      onError: (error) => {
        console.error("Erro ao carregar agendamentos de visitantes:", error.message);
      },
    }
  );

  // Mutations
  const createSchedule = trpc.schedules.create.useMutation({
    onSuccess: () => {
      toast.success("Horário criado com sucesso!");
      setCreateScheduleOpen(false);
      resetScheduleForm();
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar horário");
    },
  });

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Aluno agendado com sucesso!");
      setBookingModalOpen(false);
      resetBookingForm();
      refetchBookings();
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao agendar aluno");
    },
  });

  const updateBookingStatus = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetchBookings();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const updateVisitorBookingStatus = trpc.visitorBookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do visitante atualizado!");
      refetchVisitorBookings();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const deleteSchedule = trpc.schedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Horário excluído!");
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir horário");
    },
  });

  const resetScheduleForm = () => {
    setScheduleForm({
      name: "",
      type: "",
      dayOfWeek: "monday",
      startTime: "",
      durationMinutes: 60,
      capacity: 20,
      professorId: "",
    });
  };

  const resetBookingForm = () => {
    setBookingForm({
      studentId: "",
      bookingDate: new Date().toISOString().split('T')[0],
    });
    setBookingType("student");
    setVisitorForm({
      name: "",
      email: "",
      phone: "",
    });
  };

  const handleCreateSchedule = () => {
    if (!scheduleForm.name || !scheduleForm.type || !scheduleForm.startTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createSchedule.mutate({
      ...scheduleForm,
      professorId: scheduleForm.professorId ? parseInt(scheduleForm.professorId) : undefined,
    });
  };

  const handleBookClass = (schedule: any) => {
    setSelectedSchedule(schedule);
    setBookingModalOpen(true);
  };

  const handleViewParticipants = (schedule: any) => {
    setSelectedSchedule(schedule);
    setParticipantsModalOpen(true);
  };

  const createLead = trpc.leads.create.useMutation();
  const createVisitorBooking = trpc.visitorBookings.create.useMutation({
    onSuccess: () => {
      toast.success("Visitante agendado com sucesso! Entre em contato para confirmar.");
      setBookingModalOpen(false);
      resetBookingForm();
      refetchVisitorBookings();
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao agendar visitante");
    },
  });

  const handleCreateBooking = async () => {
    if (!bookingForm.bookingDate) {
      toast.error("Selecione uma data");
      return;
    }

    if (bookingType === "student") {
      // Agendar aluno cadastrado
      if (!bookingForm.studentId) {
        toast.error("Selecione um aluno");
        return;
      }

      createBooking.mutate({
        scheduleId: selectedSchedule.id,
        studentId: parseInt(bookingForm.studentId),
        bookingDate: bookingForm.bookingDate,
      });
    } else {
      // Agendar visitante/experimental
      if (!visitorForm.name || !visitorForm.phone) {
        toast.error("Preencha nome e telefone do visitante");
        return;
      }

      // Primeiro criar lead para CRM
      createLead.mutate({
        name: visitorForm.name,
        email: visitorForm.email || "",
        phone: visitorForm.phone,
        source: "Aula Experimental",
        notes: `Agendado para ${selectedSchedule.name} em ${new Date(bookingForm.bookingDate).toLocaleDateString('pt-BR')}`,
      }, {
        onSuccess: (leadData) => {
          // Depois criar visitor_booking
          createVisitorBooking.mutate({
            scheduleId: selectedSchedule.id,
            visitorName: visitorForm.name,
            visitorPhone: visitorForm.phone,
            visitorEmail: visitorForm.email || undefined,
            bookingDate: bookingForm.bookingDate,
            leadId: (leadData as any).leadId,
            notes: `Agendado para ${selectedSchedule.name}`,
          });
        },
        onError: (error) => {
          toast.error(error.message || "Erro ao cadastrar visitante");
        },
      });
    }
  };

  const handleStatusChange = (bookingId: number, status: string) => {
    updateBookingStatus.mutate({
      id: bookingId,
      status: status as any,
    });
  };

  const handleVisitorStatusChange = (bookingId: number, status: string) => {
    updateVisitorBookingStatus.mutate({
      id: bookingId,
      status: status as any,
    });
  };

  const filteredSchedules = schedules?.filter((schedule: any) => {
    return dayFilter === "all" || schedule.dayOfWeek === dayFilter;
  }) || [];

  const getAvailabilityBadge = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 100) {
      return <Badge variant="destructive">Lotada</Badge>;
    } else if (percentage >= 80) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Quase Lotada</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Vagas Disponíveis</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Agendamento de Aulas"
          description="Gerencie horários, reserve alunos e controle presença"
          action={
            <Dialog open={createScheduleOpen} onOpenChange={setCreateScheduleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Horário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Horário de Aula</DialogTitle>
                  <DialogDescription>
                    Crie um horário fixo na grade semanal
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Aula *</Label>
                      <Input
                        value={scheduleForm.name}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                        placeholder="Ex: Yoga Matinal"
                      />
                    </div>
                    <div>
                      <Label>Tipo *</Label>
                      <Input
                        value={scheduleForm.type}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                        placeholder="Ex: Yoga, Pilates, Spinning"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dia da Semana *</Label>
                      <Select
                        value={scheduleForm.dayOfWeek}
                        onValueChange={(value) => setScheduleForm({ ...scheduleForm, dayOfWeek: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Segunda-feira</SelectItem>
                          <SelectItem value="tuesday">Terça-feira</SelectItem>
                          <SelectItem value="wednesday">Quarta-feira</SelectItem>
                          <SelectItem value="thursday">Quinta-feira</SelectItem>
                          <SelectItem value="friday">Sexta-feira</SelectItem>
                          <SelectItem value="saturday">Sábado</SelectItem>
                          <SelectItem value="sunday">Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Horário *</Label>
                      <Input
                        type="time"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Duração (min) *</Label>
                      <Input
                        type="number"
                        value={scheduleForm.durationMinutes}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Capacidade *</Label>
                      <Input
                        type="number"
                        value={scheduleForm.capacity}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, capacity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Professor</Label>
                      <Select
                        value={scheduleForm.professorId || "none"}
                        onValueChange={(value) => setScheduleForm({ ...scheduleForm, professorId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {professors?.map((prof: any) => (
                            <SelectItem key={prof.id} value={prof.id.toString()}>
                              {prof.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreateSchedule} disabled={createSchedule.isPending} className="w-full">
                    {createSchedule.isPending ? "Criando..." : "Criar Horário"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Filtro por dia */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label>Filtrar por dia:</Label>
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os dias</SelectItem>
                  <SelectItem value="monday">Segunda-feira</SelectItem>
                  <SelectItem value="tuesday">Terça-feira</SelectItem>
                  <SelectItem value="wednesday">Quarta-feira</SelectItem>
                  <SelectItem value="thursday">Quinta-feira</SelectItem>
                  <SelectItem value="friday">Sexta-feira</SelectItem>
                  <SelectItem value="saturday">Sábado</SelectItem>
                  <SelectItem value="sunday">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grade de Horários */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Grade de Horários</CardTitle>
            <CardDescription>
              {filteredSchedules.length} aula(s) cadastrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma aula cadastrada ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aula</TableHead>
                    <TableHead>Dia</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Ocupação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{schedule.name}</div>
                          <div className="text-sm text-muted-foreground">{schedule.type}</div>
                        </div>
                      </TableCell>
                      <TableCell>{DAYS_MAP[schedule.dayOfWeek]}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {schedule.startTime?.slice(0, 5)}
                        </div>
                      </TableCell>
                      <TableCell>{schedule.durationMinutes} min</TableCell>
                      <TableCell>
                        {schedule.professorName ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {schedule.professorName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{schedule.enrolledCount || 0}/{schedule.capacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAvailabilityBadge(schedule.enrolledCount || 0, schedule.capacity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewParticipants(schedule)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Ver Lista
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleBookClass(schedule)}
                            disabled={schedule.enrolledCount >= schedule.capacity}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Agendar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir este horário?")) {
                                deleteSchedule.mutate({ id: schedule.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de Agendamento */}
        <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agendar na Aula</DialogTitle>
              <DialogDescription>
                {selectedSchedule?.name} - {DAYS_MAP[selectedSchedule?.dayOfWeek]} às {selectedSchedule?.startTime?.slice(0, 5)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Tipo de Agendamento */}
              <div>
                <Label>Tipo de Agendamento</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    variant={bookingType === "student" ? "default" : "outline"}
                    onClick={() => setBookingType("student")}
                    className="w-full"
                  >
                    Aluno Cadastrado
                  </Button>
                  <Button
                    type="button"
                    variant={bookingType === "visitor" ? "default" : "outline"}
                    onClick={() => setBookingType("visitor")}
                    className="w-full"
                  >
                    Visitante/Experimental
                  </Button>
                </div>
              </div>

              {/* Formulário para Aluno */}
              {bookingType === "student" && (
                <div>
                  <Label>Selecionar Aluno *</Label>
                  <Select
                    value={bookingForm.studentId}
                    onValueChange={(value) => setBookingForm({ ...bookingForm, studentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {!students || students.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum aluno cadastrado. Cadastre alunos primeiro!
                        </div>
                      ) : (
                        students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} {student.email ? `(${student.email})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {(!students || students.length === 0) && (
                    <p className="text-sm text-amber-600 mt-1">
                      💡 Cadastre alunos em "Gestão de Alunos" primeiro ou use "Visitante/Experimental"
                    </p>
                  )}
                </div>
              )}

              {/* Formulário para Visitante */}
              {bookingType === "visitor" && (
                <div className="max-w-7xl mx-auto px-8 py-8 space-y-3">
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                    <strong>Aula Experimental:</strong> Cadastre os dados do visitante para agendar uma aula experimental.
                  </div>
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      value={visitorForm.name}
                      onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                      placeholder="Nome do visitante"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Telefone *</Label>
                      <Input
                        value={visitorForm.phone}
                        onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={visitorForm.email}
                        onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Data da Aula */}
              <div>
                <Label>Data da Aula *</Label>
                <Input
                  type="date"
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Informações de Vagas */}
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">Vagas Disponíveis</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {selectedSchedule?.capacity - (selectedSchedule?.enrolledCount || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Capacidade total:</span>
                  <span>{selectedSchedule?.capacity} pessoas</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Já agendados:</span>
                  <span>{selectedSchedule?.enrolledCount || 0} pessoas</span>
                </div>
              </div>

              <Button onClick={handleCreateBooking} disabled={createBooking.isPending} className="w-full">
                {createBooking.isPending ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Participantes/Presença */}
        <Dialog open={participantsModalOpen} onOpenChange={setParticipantsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lista de Participantes</DialogTitle>
              <DialogDescription>
                {selectedSchedule?.name} - {bookingForm.bookingDate}
              </DialogDescription>
            </DialogHeader>
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                />
              </div>

              {/* Alunos Cadastrados */}
              {bookings && bookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alunos Cadastrados ({bookings.length})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.studentName}</TableCell>
                          <TableCell>{booking.studentEmail}</TableCell>
                          <TableCell>{booking.studentPhone || "-"}</TableCell>
                          <TableCell>
                            {booking.status === 'confirmed' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">Confirmado</Badge>
                            )}
                            {booking.status === 'attended' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Presente</Badge>
                            )}
                            {booking.status === 'no_show' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700">Faltou</Badge>
                            )}
                            {booking.status === 'cancelled' && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">Cancelado</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => handleStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="attended">Presente</SelectItem>
                                <SelectItem value="no_show">Faltou</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Visitantes/Experimentais */}
              {visitorBookings && visitorBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Visitantes/Experimentais ({visitorBookings.length})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitorBookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.visitorName}</TableCell>
                          <TableCell>{booking.visitorPhone}</TableCell>
                          <TableCell>{booking.visitorEmail || "-"}</TableCell>
                          <TableCell>
                            {booking.status === 'confirmed' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">Confirmado</Badge>
                            )}
                            {booking.status === 'attended' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Presente</Badge>
                            )}
                            {booking.status === 'no_show' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700">Faltou</Badge>
                            )}
                            {booking.status === 'cancelled' && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">Cancelado</Badge>
                            )}
                            {booking.status === 'converted' && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">Convertido em Aluno</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => handleVisitorStatusChange(booking.id, value)}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="attended">Presente</SelectItem>
                                <SelectItem value="no_show">Faltou</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                <SelectItem value="converted">Convertido em Aluno</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {(!bookings || bookings.length === 0) && (!visitorBookings || visitorBookings.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum participante agendado para esta data.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
