import { notFound } from "next/navigation";
import { loadLocale } from "@/shared/lib/page";
import { requireUser } from "@/modules/auth/guards";
import { ADMIN_ROLES } from "@/modules/auth/session";
import { resources } from "@/modules/admin/resources";
import { saveResourceAction } from "@/modules/admin/actions";
import { Card } from "@/shared/ui";
import { PageTitle } from "@/shared/layout/app-shell";
import { FieldsForm } from "@/shared/client/fields-form";
import { DeleteButton } from "@/shared/client/admin-controls";

type Props = { params: Promise<{ locale: string; resource: string; id: string }> };

export default async function EditResource({ params }: Props) {
  const { resource, id } = await params;
  const { locale, p } = await loadLocale(params);
  await requireUser(locale, p(`/admin/manage/${resource}/${id}`), ADMIN_ROLES);
  const res = resources[resource];
  if (!res) notFound();
  const row = await res.delegate.findUnique({ where: { id } });
  if (!row) notFound();
  const dyn = (await res.options?.()) ?? {};
  const fields = res.fields.map((f) => (dyn[f.name] ? { ...f, options: dyn[f.name] } : f));
  const action = saveResourceAction.bind(null, res.key, id);
  return (
    <>
      <PageTitle title={`Edit ${res.singular}`} sub={res.description} />
      <Card className="p-5 sm:p-6">
        <FieldsForm fields={fields} values={row} action={action} submitLabel="Save changes" redirectTo={p(`/admin/manage/${res.key}`)} secondary={<DeleteButton resource={res.key} id={id} />} />
      </Card>
    </>
  );
}
