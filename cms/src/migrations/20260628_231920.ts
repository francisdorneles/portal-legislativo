import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_noticias_categoria" AS ENUM('sessoes', 'projetos', 'comunicados', 'eventos', 'geral');
  CREATE TYPE "public"."enum_paginas_menu_grupo" AS ENUM('', 'institucional', 'integrantes', 'atividade', 'legislacao', 'transparencia', 'atendimento');
  CREATE TYPE "public"."enum_paginas_menu_icone" AS ENUM('documento', 'arquivo', 'calendario', 'pessoas', 'lista', 'predio', 'predio2', 'livro', 'megafone', 'balao');
  CREATE TYPE "public"."enum_documentos_categoria" AS ENUM('institucional', 'regimento', 'atas', 'contratos', 'outros');
  CREATE TYPE "public"."enum_links_uteis_categoria" AS ENUM('geral', 'municipal', 'estadual', 'federal', 'legislacao', 'transparencia', 'parceiros');
  CREATE TYPE "public"."enum_manifestacoes_tipo" AS ENUM('esic', 'ouvidoria');
  CREATE TYPE "public"."enum_manifestacoes_categoria" AS ENUM('reclamacao', 'denuncia', 'sugestao', 'elogio', 'solicitacao', 'informacao');
  CREATE TYPE "public"."enum_manifestacoes_solicitante_tipo" AS ENUM('fisica', 'juridica');
  CREATE TYPE "public"."enum_manifestacoes_forma_resposta" AS ENUM('email', 'presencial', 'correio');
  CREATE TYPE "public"."enum_manifestacoes_status" AS ENUM('recebido', 'andamento', 'respondido');
  CREATE TYPE "public"."enum_configuracoes_organograma_nivel" AS ENUM('mesa', 'diretoria', 'setor');
  CREATE TYPE "public"."enum_configuracoes_transparencia_links_categoria" AS ENUM('sistemas', 'funcionais', 'despesas', 'demonstrativos', 'patrimonio', 'contratos', 'dados');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "noticias" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"slug" varchar,
  	"resumo" varchar,
  	"corpo" jsonb,
  	"foto_id" integer,
  	"categoria" "enum_noticias_categoria" DEFAULT 'geral',
  	"data" timestamp(3) with time zone NOT NULL,
  	"publicado" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "paginas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"slug" varchar,
  	"menu_grupo" "enum_paginas_menu_grupo",
  	"menu_label" varchar,
  	"menu_desc" varchar,
  	"menu_icone" "enum_paginas_menu_icone" DEFAULT 'documento',
  	"conteudo" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documentos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"categoria" "enum_documentos_categoria" DEFAULT 'institucional' NOT NULL,
  	"arquivo_id" integer NOT NULL,
  	"descricao" varchar,
  	"data_documento" timestamp(3) with time zone,
  	"destaque" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "links_uteis" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"descricao" varchar,
  	"categoria" "enum_links_uteis_categoria" DEFAULT 'geral',
  	"ordem" numeric DEFAULT 99,
  	"ativo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"imagem_id" integer NOT NULL,
  	"link" varchar,
  	"ordem" numeric DEFAULT 0,
  	"ativo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "manifestacoes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"protocolo" varchar,
  	"tipo" "enum_manifestacoes_tipo" NOT NULL,
  	"categoria" "enum_manifestacoes_categoria",
  	"solicitante_tipo" "enum_manifestacoes_solicitante_tipo" DEFAULT 'fisica',
  	"forma_resposta" "enum_manifestacoes_forma_resposta" DEFAULT 'email',
  	"status" "enum_manifestacoes_status" DEFAULT 'recebido',
  	"nome" varchar NOT NULL,
  	"documento" varchar,
  	"email" varchar NOT NULL,
  	"telefone" varchar,
  	"assunto" varchar NOT NULL,
  	"mensagem" varchar NOT NULL,
  	"resposta" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pergunta" varchar NOT NULL,
  	"resposta" jsonb,
  	"ordem" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "acompanhamento_materia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"materia_id" numeric NOT NULL,
  	"materia_label" varchar,
  	"ultima_tramitacao_id" numeric,
  	"ativo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"noticias_id" integer,
  	"paginas_id" integer,
  	"documentos_id" integer,
  	"links_uteis_id" integer,
  	"banners_id" integer,
  	"manifestacoes_id" integer,
  	"faq_id" integer,
  	"acompanhamento_materia_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "configuracoes_galeria_agenda" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagem_id" integer NOT NULL
  );
  
  CREATE TABLE "configuracoes_organograma" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"setor" varchar NOT NULL,
  	"responsavel" varchar,
  	"nivel" "enum_configuracoes_organograma_nivel" DEFAULT 'setor',
  	"competencias" varchar
  );
  
  CREATE TABLE "configuracoes_transparencia_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"categoria" "enum_configuracoes_transparencia_links_categoria" DEFAULT 'sistemas'
  );
  
  CREATE TABLE "configuracoes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"camara_id" varchar,
  	"nome_oficial" varchar,
  	"nome_curto" varchar,
  	"inicial" varchar,
  	"logo_id" integer,
  	"imagem_fundo_id" integer,
  	"cidade" varchar,
  	"uf" varchar,
  	"plenario" varchar,
  	"contato_endereco" varchar,
  	"contato_bairro" varchar,
  	"contato_telefone" varchar,
  	"contato_email" varchar,
  	"contato_horario" varchar,
  	"redes_facebook" varchar,
  	"redes_instagram" varchar,
  	"redes_youtube" varchar,
  	"links_externos_transmissao_ao_vivo" varchar,
  	"links_externos_licitacoes" varchar,
  	"links_externos_concursos" varchar,
  	"links_externos_diario_oficial" varchar,
  	"links_externos_contas_publicas" varchar,
  	"tagline_hero" varchar,
  	"subtitulo_hero" varchar,
  	"texto_ouvidoria" varchar,
  	"texto_s_i_c" varchar,
  	"imagem_cidadania_id" integer,
  	"imagem_mais_acessados_id" integer,
  	"cor_primaria" varchar,
  	"cor_secundaria" varchar,
  	"cor_destaque" varchar,
  	"site_url" varchar,
  	"descricao_seo" varchar,
  	"palavras_chave" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documentos" ADD CONSTRAINT "documentos_arquivo_id_media_id_fk" FOREIGN KEY ("arquivo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_imagem_id_media_id_fk" FOREIGN KEY ("imagem_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_noticias_fk" FOREIGN KEY ("noticias_id") REFERENCES "public"."noticias"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_paginas_fk" FOREIGN KEY ("paginas_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documentos_fk" FOREIGN KEY ("documentos_id") REFERENCES "public"."documentos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_links_uteis_fk" FOREIGN KEY ("links_uteis_id") REFERENCES "public"."links_uteis"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_manifestacoes_fk" FOREIGN KEY ("manifestacoes_id") REFERENCES "public"."manifestacoes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_acompanhamento_materia_fk" FOREIGN KEY ("acompanhamento_materia_id") REFERENCES "public"."acompanhamento_materia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "configuracoes_galeria_agenda" ADD CONSTRAINT "configuracoes_galeria_agenda_imagem_id_media_id_fk" FOREIGN KEY ("imagem_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configuracoes_galeria_agenda" ADD CONSTRAINT "configuracoes_galeria_agenda_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."configuracoes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "configuracoes_organograma" ADD CONSTRAINT "configuracoes_organograma_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."configuracoes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "configuracoes_transparencia_links" ADD CONSTRAINT "configuracoes_transparencia_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."configuracoes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_imagem_fundo_id_media_id_fk" FOREIGN KEY ("imagem_fundo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_imagem_cidadania_id_media_id_fk" FOREIGN KEY ("imagem_cidadania_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_imagem_mais_acessados_id_media_id_fk" FOREIGN KEY ("imagem_mais_acessados_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "noticias_slug_idx" ON "noticias" USING btree ("slug");
  CREATE INDEX "noticias_foto_idx" ON "noticias" USING btree ("foto_id");
  CREATE INDEX "noticias_updated_at_idx" ON "noticias" USING btree ("updated_at");
  CREATE INDEX "noticias_created_at_idx" ON "noticias" USING btree ("created_at");
  CREATE UNIQUE INDEX "paginas_slug_idx" ON "paginas" USING btree ("slug");
  CREATE INDEX "paginas_updated_at_idx" ON "paginas" USING btree ("updated_at");
  CREATE INDEX "paginas_created_at_idx" ON "paginas" USING btree ("created_at");
  CREATE INDEX "documentos_arquivo_idx" ON "documentos" USING btree ("arquivo_id");
  CREATE INDEX "documentos_updated_at_idx" ON "documentos" USING btree ("updated_at");
  CREATE INDEX "documentos_created_at_idx" ON "documentos" USING btree ("created_at");
  CREATE INDEX "links_uteis_updated_at_idx" ON "links_uteis" USING btree ("updated_at");
  CREATE INDEX "links_uteis_created_at_idx" ON "links_uteis" USING btree ("created_at");
  CREATE INDEX "banners_imagem_idx" ON "banners" USING btree ("imagem_id");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE INDEX "manifestacoes_updated_at_idx" ON "manifestacoes" USING btree ("updated_at");
  CREATE INDEX "manifestacoes_created_at_idx" ON "manifestacoes" USING btree ("created_at");
  CREATE INDEX "faq_updated_at_idx" ON "faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "faq" USING btree ("created_at");
  CREATE INDEX "acompanhamento_materia_updated_at_idx" ON "acompanhamento_materia" USING btree ("updated_at");
  CREATE INDEX "acompanhamento_materia_created_at_idx" ON "acompanhamento_materia" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_noticias_id_idx" ON "payload_locked_documents_rels" USING btree ("noticias_id");
  CREATE INDEX "payload_locked_documents_rels_paginas_id_idx" ON "payload_locked_documents_rels" USING btree ("paginas_id");
  CREATE INDEX "payload_locked_documents_rels_documentos_id_idx" ON "payload_locked_documents_rels" USING btree ("documentos_id");
  CREATE INDEX "payload_locked_documents_rels_links_uteis_id_idx" ON "payload_locked_documents_rels" USING btree ("links_uteis_id");
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX "payload_locked_documents_rels_manifestacoes_id_idx" ON "payload_locked_documents_rels" USING btree ("manifestacoes_id");
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_id");
  CREATE INDEX "payload_locked_documents_rels_acompanhamento_materia_id_idx" ON "payload_locked_documents_rels" USING btree ("acompanhamento_materia_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "configuracoes_galeria_agenda_order_idx" ON "configuracoes_galeria_agenda" USING btree ("_order");
  CREATE INDEX "configuracoes_galeria_agenda_parent_id_idx" ON "configuracoes_galeria_agenda" USING btree ("_parent_id");
  CREATE INDEX "configuracoes_galeria_agenda_imagem_idx" ON "configuracoes_galeria_agenda" USING btree ("imagem_id");
  CREATE INDEX "configuracoes_organograma_order_idx" ON "configuracoes_organograma" USING btree ("_order");
  CREATE INDEX "configuracoes_organograma_parent_id_idx" ON "configuracoes_organograma" USING btree ("_parent_id");
  CREATE INDEX "configuracoes_transparencia_links_order_idx" ON "configuracoes_transparencia_links" USING btree ("_order");
  CREATE INDEX "configuracoes_transparencia_links_parent_id_idx" ON "configuracoes_transparencia_links" USING btree ("_parent_id");
  CREATE INDEX "configuracoes_logo_idx" ON "configuracoes" USING btree ("logo_id");
  CREATE INDEX "configuracoes_imagem_fundo_idx" ON "configuracoes" USING btree ("imagem_fundo_id");
  CREATE INDEX "configuracoes_imagem_cidadania_idx" ON "configuracoes" USING btree ("imagem_cidadania_id");
  CREATE INDEX "configuracoes_imagem_mais_acessados_idx" ON "configuracoes" USING btree ("imagem_mais_acessados_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "noticias" CASCADE;
  DROP TABLE "paginas" CASCADE;
  DROP TABLE "documentos" CASCADE;
  DROP TABLE "links_uteis" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "manifestacoes" CASCADE;
  DROP TABLE "faq" CASCADE;
  DROP TABLE "acompanhamento_materia" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "configuracoes_galeria_agenda" CASCADE;
  DROP TABLE "configuracoes_organograma" CASCADE;
  DROP TABLE "configuracoes_transparencia_links" CASCADE;
  DROP TABLE "configuracoes" CASCADE;
  DROP TYPE "public"."enum_noticias_categoria";
  DROP TYPE "public"."enum_paginas_menu_grupo";
  DROP TYPE "public"."enum_paginas_menu_icone";
  DROP TYPE "public"."enum_documentos_categoria";
  DROP TYPE "public"."enum_links_uteis_categoria";
  DROP TYPE "public"."enum_manifestacoes_tipo";
  DROP TYPE "public"."enum_manifestacoes_categoria";
  DROP TYPE "public"."enum_manifestacoes_solicitante_tipo";
  DROP TYPE "public"."enum_manifestacoes_forma_resposta";
  DROP TYPE "public"."enum_manifestacoes_status";
  DROP TYPE "public"."enum_configuracoes_organograma_nivel";
  DROP TYPE "public"."enum_configuracoes_transparencia_links_categoria";`)
}
