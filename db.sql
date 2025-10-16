CREATE TABLE public.document_roles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  document_id bigint NOT NULL,
  user_id uuid NOT NULL,
  role character varying NOT NULL DEFAULT ''::character varying,
  CONSTRAINT document_roles_pkey PRIMARY KEY (id),
  CONSTRAINT document_roles_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.documents (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL DEFAULT ''::character varying,
  content text,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  url uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  organization_id bigint,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_created_by_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id),
  CONSTRAINT documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  profile bytea,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_organizations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  organization_id bigint NOT NULL,
  role character varying NOT NULL DEFAULT ''::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_organizations_pkey PRIMARY KEY (id),
  CONSTRAINT user_organizations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT user_organizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
