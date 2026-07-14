"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  FormGrid,
  Spinner,
  TextField,
  TextareaField,
} from "@/components/shared";
import { submitContactRequest } from "../actions";
import { contactRequestSchema, type ContactRequestInput } from "../schema";

/** Form della pagina /contatti. */
export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<ContactRequestInput>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitContactRequest(values);
      if (result.ok) {
        toast.success("Richiesta inviata! Ti risponderemo al più presto.");
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormGrid>
        <TextField
          control={form.control}
          name="name"
          label="Nome e cognome"
          placeholder="Mario Rossi"
          required
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="mario.rossi@azienda.it"
          required
        />
      </FormGrid>
      <TextField
        control={form.control}
        name="company"
        label="Azienda"
        placeholder="La tua azienda (facoltativo)"
      />
      <TextareaField
        control={form.control}
        name="message"
        label="Messaggio"
        placeholder="Raccontaci di cosa hai bisogno…"
        rows={5}
        required
      />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : <Send className="size-4" />}
          Invia richiesta
        </Button>
      </div>
    </form>
  );
}
