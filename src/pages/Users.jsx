import { useState } from "react";
import { UserTable } from "../components/panels/UserTable";
import {
  DeleteUserDialog,
  UserFormDialog,
} from "../components/panels/UserDialogs";
import { Button } from "../components/ui/Button";
import { IconPlus, IconTrash } from "../components/Icons";
import { isLastAdmin } from "../data/users";
import { useTranslation } from "../i18n/context";

export function Users({ users, onAdd, onDelete }) {
  const { t } = useTranslation();
  const [selectedLogin, setSelectedLogin] = useState(null);
  const [dialog, setDialog] = useState(null);

  const selected = users.find((user) => user.login === selectedLogin) ?? null;
  const lastAdmin = Boolean(selected) && isLastAdmin(users, selected);

  // Why the button is off, in the order the user needs to hear it: pick
  // somebody first, and if that somebody is the only admin left, the account
  // that keeps this screen reachable cannot be the one deleted.
  const deleteHint = !selected
    ? t("usr.selectFirst")
    : lastAdmin
      ? t("usr.lastAdmin")
      : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <UserTable
        users={users}
        title={t("usr.title")}
        hint={t("usr.hint")}
        isSelected={(user) => user.login === selected?.login}
        onSelect={(user) =>
          setSelectedLogin(user.login === selected?.login ? null : user.login)
        }
        actions={
          <>
            <Button variant="primary" onClick={() => setDialog("add")}>
              <IconPlus className="h-4 w-4" />
              {t("usr.add")}
            </Button>
            <Button
              onClick={() => setDialog("confirmDelete")}
              disabled={!selected || lastAdmin}
              title={deleteHint}
            >
              <IconTrash className="h-4 w-4" />
              {t("usr.delete")}
            </Button>
          </>
        }
      />

      {dialog === "add" ? (
        <UserFormDialog
          users={users}
          onCancel={() => setDialog(null)}
          onSubmit={(user) => {
            onAdd(user);
            setSelectedLogin(user.login);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "confirmDelete" && selected ? (
        <DeleteUserDialog
          user={selected}
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            onDelete(selected.login);
            setSelectedLogin(null);
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}
