--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2026-05-15 20:23:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 25245)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5409 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 948 (class 1247 OID 25459)
-- Name: tipo_acao_auditoria; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_acao_auditoria AS ENUM (
    'CADASTRO_LIVRO',
    'UPDATE_LIVRO',
    'DELETE_LIVRO',
    'CADASTRO_USUARIO',
    'UPDATE_USUARIO',
    'DELETE_USUARIO',
    'REGISTRO_EMPRESTIMO',
    'REGISTRO_DEVOLUCAO'
);


ALTER TYPE public.tipo_acao_auditoria OWNER TO postgres;

--
-- TOC entry 942 (class 1247 OID 25405)
-- Name: tipo_transacao_financeira; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipo_transacao_financeira AS ENUM (
    'multa_atraso',
    'venda_livro',
    'orcamento_acervo',
    'outra_entrada',
    'outra_despesa'
);


ALTER TYPE public.tipo_transacao_financeira OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 51092)
-- Name: atualizar_num_emprestimos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.atualizar_num_emprestimos() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo = 'emprestimo' THEN
    UPDATE livro SET num_emprestimos = num_emprestimos + 1 WHERE id = NEW.livro_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualizar_num_emprestimos() OWNER TO postgres;

--
-- TOC entry 281 (class 1255 OID 42795)
-- Name: calculate_session_duration(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_session_duration() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.logout_time IS NOT NULL THEN
        NEW.session_duration_seconds = EXTRACT(EPOCH FROM (NEW.logout_time - NEW.login_time))::INTEGER;
        NEW.is_active = FALSE;
    ELSIF NEW.last_seen IS NOT NULL THEN
        -- Se last_seen está há mais de 10 minutos, considera timeout
        IF NEW.last_seen < CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN
            NEW.session_duration_seconds = EXTRACT(EPOCH FROM (NEW.last_seen - NEW.login_time))::INTEGER;
            NEW.status = 'timeout';
            NEW.is_active = FALSE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_session_duration() OWNER TO postgres;

--
-- TOC entry 296 (class 1255 OID 42534)
-- Name: finalizar_pedido_cancelado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.finalizar_pedido_cancelado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r_item RECORD;
BEGIN
  -- Só executa quando o status muda para 'cancelado'
  IF (OLD.status IS DISTINCT FROM 'cancelado') AND (NEW.status = 'cancelado') THEN

    -- 1. Repor o estoque de cada livro
    FOR r_item IN
      SELECT livro_id, quantidade FROM item_pedido WHERE pedido_id = NEW.id
    LOOP
      UPDATE livro
         SET quantidade_disponivel = quantidade_disponivel + r_item.quantidade
       WHERE id = r_item.livro_id;
    END LOOP;

    -- 2. Registrar saída financeira (estorno/cancelamento)
    INSERT INTO "Transacao_Financeira" (id, descricao, valor, tipo, data_transacao, usuario_id, emprestimo_id)
    VALUES (
      gen_random_uuid(),
      CONCAT('Cancelamento de pedido ', NEW.codigo, ' - estorno'),
      NEW.total,
      'SAIDA',
      NOW(),
      NEW.usuario_id,
      NULL
    );

    -- 3. Registrar ação na auditoria
    INSERT INTO "Auditoria_Acoes"(id, detalhes, tipo, data_acao, usuario_id)
    VALUES (
      gen_random_uuid(),
      CONCAT('Pedido ', NEW.codigo, ' cancelado; estoque devolvido e saída financeira registrada.'),
      'OPERACAO',
      NOW(),
      NEW.usuario_id
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.finalizar_pedido_cancelado() OWNER TO postgres;

--
-- TOC entry 295 (class 1255 OID 42533)
-- Name: finalizar_pedido_pago(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.finalizar_pedido_pago() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r_item RECORD;
BEGIN
  -- Só executa quando o status muda para 'pago'
  IF (OLD.status IS DISTINCT FROM 'pago') AND (NEW.status = 'pago') THEN
    -- Percorre cada item do pedido
    FOR r_item IN
      SELECT livro_id, quantidade FROM item_pedido WHERE pedido_id = NEW.id
    LOOP
      -- Atualiza o estoque do livro correspondente
      UPDATE livro
         SET quantidade_disponivel = quantidade_disponivel - r_item.quantidade
       WHERE id = r_item.livro_id;

      -- Se ficar negativo, lança erro
      IF (SELECT quantidade_disponivel FROM livro WHERE id = r_item.livro_id) < 0 THEN
        RAISE EXCEPTION 'Estoque negativo para livro % ao finalizar pedido %', r_item.livro_id, NEW.id;
      END IF;
    END LOOP;

    -- Registra transação financeira
    INSERT INTO "Transacao_Financeira" (id, descricao, valor, tipo, data_transacao, usuario_id, emprestimo_id)
    VALUES (
      gen_random_uuid(),
      CONCAT('Venda de livros - Pedido ', NEW.codigo),
      NEW.total,
      'ENTRADA',
      NOW(),
      NEW.usuario_id,
      NULL
    );

    -- Registra auditoria
    INSERT INTO "Auditoria_Acoes"(id, detalhes, tipo, data_acao, usuario_id)
    VALUES (
      gen_random_uuid(),
      CONCAT('Pedido ', NEW.codigo, ' pago; baixa de estoque e lançamento financeiro gerados.'),
      'OPERACAO',
      NOW(),
      NEW.usuario_id
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.finalizar_pedido_pago() OWNER TO postgres;

--
-- TOC entry 297 (class 1255 OID 51113)
-- Name: recomendar_livros(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.recomendar_livros(p_aluno_id uuid, p_limite integer DEFAULT 10) RETURNS TABLE(id integer, titulo character varying, autor_nome character varying, categoria_nome character varying, capa_url text, disponivel boolean, score integer, motivo character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.titulo,
    (SELECT a.nome FROM autor a
     JOIN livro_autor la ON la.autor_id = a.id
     WHERE la.livro_id = l.id LIMIT 1) AS autor_nome,
    (SELECT c.nome FROM categoria c
     JOIN livro_categoria lc ON lc.categoria_id = c.id
     WHERE lc.livro_id = l.id LIMIT 1) AS categoria_nome,
    l.capa_url,
    (l.quantidade_disponivel > 0) AS disponivel,
    (
      -- Categoria favorita: +30
      CASE WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN categoria c ON c.nome = pa.valor
        JOIN livro_categoria lc ON lc.categoria_id = c.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'categoria'
        AND lc.livro_id = l.id
      ) THEN 30 ELSE 0 END

      +

      -- Autor favorito: +40
      CASE WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN autor au ON au.nome = pa.valor
        JOIN livro_autor la ON la.autor_id = au.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'autor'
        AND la.livro_id = l.id
      ) THEN 40 ELSE 0 END

      +

      -- Alunos com gostos similares: até +15
      COALESCE((
        SELECT LEAST(COUNT(*)::INT * 5, 15)
        FROM emprestimo e3
        WHERE e3.livro_id = l.id
        AND e3.tipo = 'emprestimo'
        AND e3.usuario_id IN (
          SELECT DISTINCT e4.usuario_id
          FROM emprestimo e4
          JOIN emprestimo e5 ON e4.livro_id = e5.livro_id
          WHERE e5.usuario_id = p_aluno_id
          AND e4.usuario_id != p_aluno_id
          AND e4.tipo = 'emprestimo'
          LIMIT 20
        )
      ), 0)
    )::INT AS score,

    CASE
      WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN autor au ON au.nome = pa.valor
        JOIN livro_autor la ON la.autor_id = au.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'autor'
        AND la.livro_id = l.id
      ) THEN 'Seu autor favorito'
      WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN categoria c ON c.nome = pa.valor
        JOIN livro_categoria lc ON lc.categoria_id = c.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'categoria'
        AND lc.livro_id = l.id
      ) THEN 'Sua categoria favorita'
      ELSE 'Alunos com gosto parecido'
    END AS motivo

  FROM livro l
  WHERE l.id NOT IN (
    SELECT livro_id FROM emprestimo
    WHERE usuario_id = p_aluno_id AND tipo = 'emprestimo'
  )
  ORDER BY score DESC, l.num_emprestimos DESC, l.titulo ASC
  LIMIT p_limite;
END;
$$;


ALTER FUNCTION public.recomendar_livros(p_aluno_id uuid, p_limite integer) OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 42531)
-- Name: registrar_transacao_venda(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_transacao_venda() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "Transacao_Financeira" (id, descricao, valor, tipo, data_transacao, usuario_id)
  VALUES (
    gen_random_uuid(),
    CONCAT('Venda de livros - Pedido ', NEW.id),
    NEW.total,
    'ENTRADA',
    NOW(),
    NEW.usuario_id
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.registrar_transacao_venda() OWNER TO postgres;

--
-- TOC entry 279 (class 1255 OID 42778)
-- Name: update_atualizado_em(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_atualizado_em() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_atualizado_em() OWNER TO postgres;

--
-- TOC entry 283 (class 1255 OID 51181)
-- Name: update_integrations_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_integrations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_integrations_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 25475)
-- Name: Auditoria_Acoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Auditoria_Acoes" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    detalhes character varying(255) NOT NULL,
    tipo public.tipo_acao_auditoria NOT NULL,
    data_acao timestamp with time zone DEFAULT now(),
    usuario_id uuid NOT NULL
);


ALTER TABLE public."Auditoria_Acoes" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 25415)
-- Name: Transacao_Financeira; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transacao_Financeira" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    descricao character varying(255) NOT NULL,
    valor numeric(10,2) NOT NULL,
    tipo public.tipo_transacao_financeira NOT NULL,
    data_transacao timestamp with time zone DEFAULT now(),
    usuario_id uuid,
    emprestimo_id uuid
);


ALTER TABLE public."Transacao_Financeira" OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 42704)
-- Name: access_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_logs (
    id integer NOT NULL,
    usuario_id uuid,
    email character varying(255) NOT NULL,
    nome character varying(255),
    foto_url text,
    login_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logout_time timestamp without time zone,
    last_seen timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_duration_seconds integer,
    status character varying(20) DEFAULT 'success'::character varying NOT NULL,
    failure_reason character varying(255),
    ip_address character varying(45),
    user_agent text,
    browser character varying(100),
    os character varying(100),
    device_type character varying(50),
    is_active boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.access_logs OWNER TO postgres;

--
-- TOC entry 5410 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE access_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.access_logs IS 'Registra todas as tentativas de login e sessões ativas';


--
-- TOC entry 5411 (class 0 OID 0)
-- Dependencies: 240
-- Name: COLUMN access_logs.last_seen; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.access_logs.last_seen IS 'Atualizado pelo heartbeat a cada 60 segundos';


--
-- TOC entry 5412 (class 0 OID 0)
-- Dependencies: 240
-- Name: COLUMN access_logs.session_duration_seconds; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.access_logs.session_duration_seconds IS 'Duração total da sessão em segundos';


--
-- TOC entry 5413 (class 0 OID 0)
-- Dependencies: 240
-- Name: COLUMN access_logs.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.access_logs.is_active IS 'TRUE apenas para sessões ativas no momento';


--
-- TOC entry 239 (class 1259 OID 42703)
-- Name: access_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.access_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.access_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5414 (class 0 OID 0)
-- Dependencies: 239
-- Name: access_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.access_logs_id_seq OWNED BY public.access_logs.id;


--
-- TOC entry 266 (class 1259 OID 51139)
-- Name: ai_book_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_book_metadata (
    id integer NOT NULL,
    book_id uuid NOT NULL,
    mood_key character varying(30),
    quote text,
    emotion_tags text[] DEFAULT '{}'::text[],
    recommended_for text[] DEFAULT '{}'::text[],
    reading_time_minutes integer,
    reading_difficulty character varying(10),
    summary_ai text,
    generated_at timestamp with time zone DEFAULT now(),
    provider_used character varying(30),
    CONSTRAINT ai_book_metadata_reading_difficulty_check CHECK (((reading_difficulty)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])))
);


ALTER TABLE public.ai_book_metadata OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 51138)
-- Name: ai_book_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_book_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_book_metadata_id_seq OWNER TO postgres;

--
-- TOC entry 5415 (class 0 OID 0)
-- Dependencies: 265
-- Name: ai_book_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_book_metadata_id_seq OWNED BY public.ai_book_metadata.id;


--
-- TOC entry 242 (class 1259 OID 42731)
-- Name: audit_trail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_trail (
    id integer NOT NULL,
    usuario_id uuid,
    usuario_nome character varying(255),
    usuario_email character varying(255),
    usuario_role character varying(100),
    action character varying(100) NOT NULL,
    categoria character varying(50),
    descricao text NOT NULL,
    target_type character varying(50),
    target_id integer,
    target_info jsonb,
    ip_address character varying(45),
    old_value jsonb,
    new_value jsonb,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_trail OWNER TO postgres;

--
-- TOC entry 5416 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE audit_trail; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_trail IS 'Auditoria completa de ações administrativas';


--
-- TOC entry 241 (class 1259 OID 42730)
-- Name: audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_trail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_trail_id_seq OWNER TO postgres;

--
-- TOC entry 5417 (class 0 OID 0)
-- Dependencies: 241
-- Name: audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_trail_id_seq OWNED BY public.audit_trail.id;


--
-- TOC entry 219 (class 1259 OID 25268)
-- Name: autor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.autor (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    biografia text,
    data_nascimento date,
    nacionalidade character varying(100),
    foto_url character varying(500)
);


ALTER TABLE public.autor OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 42883)
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avaliacoes (
    id integer NOT NULL,
    livro_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nota integer NOT NULL,
    comentario text NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT avaliacoes_comentario_check CHECK ((length(comentario) <= 1000)),
    CONSTRAINT avaliacoes_nota_check CHECK (((nota >= 1) AND (nota <= 5)))
);


ALTER TABLE public.avaliacoes OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 50991)
-- Name: avaliacoes_autor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avaliacoes_autor (
    id integer NOT NULL,
    autor_id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    nota integer NOT NULL,
    comentario text NOT NULL,
    data_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT avaliacoes_autor_nota_check CHECK (((nota >= 1) AND (nota <= 5)))
);


ALTER TABLE public.avaliacoes_autor OWNER TO postgres;

--
-- TOC entry 5418 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE avaliacoes_autor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.avaliacoes_autor IS 'Armazena as avaliações dos usuários sobre os autores';


--
-- TOC entry 252 (class 1259 OID 50990)
-- Name: avaliacoes_autor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avaliacoes_autor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avaliacoes_autor_id_seq OWNER TO postgres;

--
-- TOC entry 5419 (class 0 OID 0)
-- Dependencies: 252
-- Name: avaliacoes_autor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avaliacoes_autor_id_seq OWNED BY public.avaliacoes_autor.id;


--
-- TOC entry 250 (class 1259 OID 42882)
-- Name: avaliacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.avaliacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.avaliacoes_id_seq OWNER TO postgres;

--
-- TOC entry 5420 (class 0 OID 0)
-- Dependencies: 250
-- Name: avaliacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.avaliacoes_id_seq OWNED BY public.avaliacoes.id;


--
-- TOC entry 220 (class 1259 OID 25276)
-- Name: categoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text
);


ALTER TABLE public.categoria OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 51018)
-- Name: curtidas_comentario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.curtidas_comentario (
    id integer NOT NULL,
    tipo_comentario character varying(20) NOT NULL,
    comentario_id integer NOT NULL,
    usuario_id uuid NOT NULL,
    data_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT curtidas_comentario_tipo_comentario_check CHECK (((tipo_comentario)::text = ANY ((ARRAY['livro'::character varying, 'autor'::character varying])::text[])))
);


ALTER TABLE public.curtidas_comentario OWNER TO postgres;

--
-- TOC entry 5421 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE curtidas_comentario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.curtidas_comentario IS 'Armazena as curtidas dos usuários em comentários de livros e autores';


--
-- TOC entry 5422 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN curtidas_comentario.tipo_comentario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.curtidas_comentario.tipo_comentario IS 'Tipo do comentário: "livro" ou "autor"';


--
-- TOC entry 5423 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN curtidas_comentario.comentario_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.curtidas_comentario.comentario_id IS 'ID da avaliação (avaliacoes.id ou avaliacoes_autor.id)';


--
-- TOC entry 254 (class 1259 OID 51017)
-- Name: curtidas_comentario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.curtidas_comentario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.curtidas_comentario_id_seq OWNER TO postgres;

--
-- TOC entry 5424 (class 0 OID 0)
-- Dependencies: 254
-- Name: curtidas_comentario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.curtidas_comentario_id_seq OWNED BY public.curtidas_comentario.id;


--
-- TOC entry 232 (class 1259 OID 42554)
-- Name: dominios_permitidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dominios_permitidos (
    id integer NOT NULL,
    dominio character varying(255) NOT NULL,
    descricao character varying(500),
    ativo boolean DEFAULT true,
    criado_por uuid,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dominios_permitidos OWNER TO postgres;

--
-- TOC entry 5425 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE dominios_permitidos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.dominios_permitidos IS 'Armazena os domínios de e-mail institucionais permitidos para login via Google OAuth';


--
-- TOC entry 5426 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN dominios_permitidos.dominio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.dominios_permitidos.dominio IS 'Domínio no formato @instituicao.edu.br';


--
-- TOC entry 5427 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN dominios_permitidos.descricao; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.dominios_permitidos.descricao IS 'Descrição da instituição ou propósito do domínio';


--
-- TOC entry 5428 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN dominios_permitidos.ativo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.dominios_permitidos.ativo IS 'Indica se o domínio está atualmente permitido para login';


--
-- TOC entry 231 (class 1259 OID 42553)
-- Name: dominios_permitidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dominios_permitidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dominios_permitidos_id_seq OWNER TO postgres;

--
-- TOC entry 5429 (class 0 OID 0)
-- Dependencies: 231
-- Name: dominios_permitidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dominios_permitidos_id_seq OWNED BY public.dominios_permitidos.id;


--
-- TOC entry 223 (class 1259 OID 25313)
-- Name: emprestimo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emprestimo (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    data_emprestimo date DEFAULT CURRENT_DATE NOT NULL,
    data_devolucao_prevista date NOT NULL,
    data_devolucao_real date,
    status character varying(50) NOT NULL,
    usuario_id uuid NOT NULL,
    livro_id uuid NOT NULL,
    tipo character varying(20) DEFAULT 'emprestimo'::character varying,
    data_reserva timestamp with time zone,
    data_expiracao date,
    data_retirada date,
    posicao_fila integer,
    notificado boolean DEFAULT false,
    CONSTRAINT emprestimo_status_check CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'atrasado'::character varying, 'devolvido'::character varying, 'renovado'::character varying, 'aguardando'::character varying, 'disponivel'::character varying, 'cancelado'::character varying, 'concluido'::character varying, 'expirado'::character varying, 'ativa'::character varying, 'cancelada'::character varying, 'atendida'::character varying])::text[]))),
    CONSTRAINT emprestimo_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['emprestimo'::character varying, 'reserva'::character varying])::text[])))
);


ALTER TABLE public.emprestimo OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 51166)
-- Name: integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integrations (
    id integer NOT NULL,
    library_id integer,
    provider character varying(30) NOT NULL,
    api_key_encrypted text,
    model character varying(60),
    enabled boolean DEFAULT false NOT NULL,
    features_enabled text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT integrations_provider_check CHECK (((provider)::text = ANY ((ARRAY['openai'::character varying, 'gemini'::character varying, 'google_books'::character varying])::text[])))
);


ALTER TABLE public.integrations OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 51165)
-- Name: integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.integrations_id_seq OWNER TO postgres;

--
-- TOC entry 5430 (class 0 OID 0)
-- Dependencies: 267
-- Name: integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.integrations_id_seq OWNED BY public.integrations.id;


--
-- TOC entry 230 (class 1259 OID 42515)
-- Name: item_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_pedido (
    id uuid NOT NULL,
    pedido_id uuid NOT NULL,
    livro_id uuid NOT NULL,
    quantidade integer NOT NULL,
    preco_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((quantidade)::numeric * preco_unitario)) STORED
);


ALTER TABLE public.item_pedido OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 25286)
-- Name: livro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.livro (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titulo character varying(255) NOT NULL,
    isbn character varying(20),
    ano_publicacao integer,
    num_paginas integer,
    sinopse text,
    capa_url character varying(255),
    data_cadastro timestamp with time zone DEFAULT now(),
    quantidade_disponivel integer DEFAULT 0 NOT NULL,
    preco numeric(12,2) DEFAULT 0 NOT NULL,
    preco_promocional numeric(12,2),
    promocao_ativa boolean DEFAULT false NOT NULL,
    num_emprestimos integer DEFAULT 0
);


ALTER TABLE public.livro OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25349)
-- Name: livro_autor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.livro_autor (
    livro_id uuid NOT NULL,
    autor_id uuid NOT NULL
);


ALTER TABLE public.livro_autor OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 25364)
-- Name: livro_categoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.livro_categoria (
    livro_id uuid NOT NULL,
    categoria_id uuid NOT NULL
);


ALTER TABLE public.livro_categoria OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 51115)
-- Name: moods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moods (
    id integer NOT NULL,
    key character varying(30) NOT NULL,
    name_pt character varying(60) NOT NULL,
    primary_color character varying(7) NOT NULL,
    secondary_color character varying(7) NOT NULL,
    gradient_start character varying(7) NOT NULL,
    gradient_end character varying(7) NOT NULL,
    glow_color character varying(7) NOT NULL,
    emoji character varying(10) NOT NULL,
    description_short character varying(120) NOT NULL
);


ALTER TABLE public.moods OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 51114)
-- Name: moods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.moods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moods_id_seq OWNER TO postgres;

--
-- TOC entry 5431 (class 0 OID 0)
-- Dependencies: 263
-- Name: moods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.moods_id_seq OWNED BY public.moods.id;


--
-- TOC entry 249 (class 1259 OID 42799)
-- Name: notificacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacao (
    id integer NOT NULL,
    usuario_id uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    titulo character varying(255) NOT NULL,
    mensagem text NOT NULL,
    lida boolean DEFAULT false,
    data_criacao timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notificacao OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 42798)
-- Name: notificacao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notificacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificacao_id_seq OWNER TO postgres;

--
-- TOC entry 5432 (class 0 OID 0)
-- Dependencies: 248
-- Name: notificacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notificacao_id_seq OWNED BY public.notificacao.id;


--
-- TOC entry 261 (class 1259 OID 51075)
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo character varying(50) NOT NULL,
    titulo character varying(120) NOT NULL,
    mensagem text NOT NULL,
    lida boolean DEFAULT false,
    criada_em timestamp without time zone DEFAULT now(),
    dados jsonb
);


ALTER TABLE public.notificacoes OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 42752)
-- Name: notifications_sent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications_sent (
    id integer NOT NULL,
    enviado_por uuid,
    enviado_por_nome character varying(255),
    enviado_por_email character varying(255),
    destinatario_id uuid,
    destinatario_nome character varying(255),
    destinatario_email character varying(255),
    destinatario_telefone character varying(20),
    tipo character varying(20) NOT NULL,
    assunto character varying(255),
    mensagem text NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    erro text,
    enviado_em timestamp without time zone,
    entregue_em timestamp without time zone,
    n8n_webhook_id character varying(255),
    external_id character varying(255),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications_sent OWNER TO postgres;

--
-- TOC entry 5433 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE notifications_sent; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications_sent IS 'Histórico de notificações enviadas manualmente';


--
-- TOC entry 243 (class 1259 OID 42751)
-- Name: notifications_sent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_sent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_sent_id_seq OWNER TO postgres;

--
-- TOC entry 5434 (class 0 OID 0)
-- Dependencies: 243
-- Name: notifications_sent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_sent_id_seq OWNED BY public.notifications_sent.id;


--
-- TOC entry 229 (class 1259 OID 42496)
-- Name: pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedido (
    id uuid NOT NULL,
    usuario_id uuid NOT NULL,
    data_pedido timestamp with time zone DEFAULT now(),
    status character varying(50) DEFAULT 'pendente'::character varying NOT NULL,
    total numeric(10,2) NOT NULL,
    metodo_pagamento character varying(30),
    tipo_entrega character varying(30),
    endereco_entrega text,
    pix_payload text,
    pix_qr text,
    pix_status character varying(20),
    pix_simulated_until timestamp with time zone
);


ALTER TABLE public.pedido OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 42638)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    categoria character varying(50),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 5435 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.permissions IS 'Define todas as permissões disponíveis no sistema';


--
-- TOC entry 233 (class 1259 OID 42637)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5436 (class 0 OID 0)
-- Dependencies: 233
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 262 (class 1259 OID 51097)
-- Name: preferencias_aluno; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preferencias_aluno (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    aluno_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    valor character varying(100) NOT NULL,
    criada_em timestamp without time zone DEFAULT now(),
    CONSTRAINT preferencias_aluno_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['categoria'::character varying, 'autor'::character varying])::text[])))
);


ALTER TABLE public.preferencias_aluno OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 25331)
-- Name: reserva; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reserva (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    data_reserva timestamp with time zone DEFAULT now(),
    status character varying(50) NOT NULL,
    data_expiracao date NOT NULL,
    usuario_id uuid NOT NULL,
    livro_id uuid NOT NULL,
    CONSTRAINT reserva_status_check CHECK (((status)::text = ANY ((ARRAY['ativa'::character varying, 'cancelada'::character varying, 'atendida'::character varying, 'aguardando'::character varying, 'disponivel'::character varying, 'cancelado'::character varying, 'concluido'::character varying, 'expirado'::character varying])::text[])))
);


ALTER TABLE public.reserva OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 51037)
-- Name: respostas_comentario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.respostas_comentario (
    id integer NOT NULL,
    tipo_comentario character varying(20) NOT NULL,
    comentario_id integer NOT NULL,
    usuario_id uuid NOT NULL,
    texto text NOT NULL,
    data_criacao timestamp without time zone DEFAULT now(),
    CONSTRAINT respostas_comentario_tipo_comentario_check CHECK (((tipo_comentario)::text = ANY ((ARRAY['livro'::character varying, 'autor'::character varying])::text[])))
);


ALTER TABLE public.respostas_comentario OWNER TO postgres;

--
-- TOC entry 5437 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE respostas_comentario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.respostas_comentario IS 'Armazena as respostas dos usuários em comentários de livros e autores';


--
-- TOC entry 5438 (class 0 OID 0)
-- Dependencies: 257
-- Name: COLUMN respostas_comentario.tipo_comentario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.respostas_comentario.tipo_comentario IS 'Tipo do comentário original: "livro" ou "autor"';


--
-- TOC entry 5439 (class 0 OID 0)
-- Dependencies: 257
-- Name: COLUMN respostas_comentario.comentario_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.respostas_comentario.comentario_id IS 'ID da avaliação original (avaliacoes.id ou avaliacoes_autor.id)';


--
-- TOC entry 256 (class 1259 OID 51036)
-- Name: respostas_comentario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.respostas_comentario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respostas_comentario_id_seq OWNER TO postgres;

--
-- TOC entry 5440 (class 0 OID 0)
-- Dependencies: 256
-- Name: respostas_comentario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.respostas_comentario_id_seq OWNED BY public.respostas_comentario.id;


--
-- TOC entry 222 (class 1259 OID 25297)
-- Name: resumo_ia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resumo_ia (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    resumo_texto text NOT NULL,
    data_geracao timestamp with time zone DEFAULT now(),
    modelo_utilizado character varying(100),
    livro_id uuid NOT NULL
);


ALTER TABLE public.resumo_ia OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 42669)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 5441 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.role_permissions IS 'Relacionamento muitos-para-muitos entre roles e permissions';


--
-- TOC entry 237 (class 1259 OID 42668)
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- TOC entry 5442 (class 0 OID 0)
-- Dependencies: 237
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- TOC entry 236 (class 1259 OID 42652)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    is_system_role boolean DEFAULT false,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 5443 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.roles IS 'Grupos de permissões que podem ser atribuídos a utilizadores';


--
-- TOC entry 235 (class 1259 OID 42651)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5444 (class 0 OID 0)
-- Dependencies: 235
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 218 (class 1259 OID 25256)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255),
    tipo_usuario character varying(50) NOT NULL,
    data_cadastro timestamp with time zone DEFAULT now(),
    foto_url character varying(255),
    codigo_acesso character varying(100),
    is_google_user boolean DEFAULT false,
    google_id character varying(255),
    role_id integer,
    is_blocked boolean DEFAULT false,
    blocked_at timestamp without time zone,
    blocked_by uuid,
    blocked_reason text,
    telefone character varying(20),
    CONSTRAINT usuario_tipo_usuario_check CHECK (((tipo_usuario)::text = ANY ((ARRAY['aluno'::character varying, 'bibliotecario'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 5445 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuario.is_google_user; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.is_google_user IS 'Indica se o usuário fez cadastro via Google OAuth';


--
-- TOC entry 5446 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuario.google_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.google_id IS 'ID único do usuário no Google (usado para autenticação OAuth)';


--
-- TOC entry 5447 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuario.role_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.role_id IS 'Grupo de permissão atribuído ao utilizador';


--
-- TOC entry 5448 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuario.is_blocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.is_blocked IS 'Indica se o utilizador está bloqueado pelo admin';


--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuario.telefone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.telefone IS 'Número de telefone para notificações via WhatsApp';


--
-- TOC entry 245 (class 1259 OID 42781)
-- Name: vw_active_sessions; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_active_sessions AS
 SELECT id,
    usuario_id,
    nome,
    email,
    foto_url,
    login_time,
    last_seen,
    ip_address,
    browser,
    os,
    device_type,
    (EXTRACT(epoch FROM (CURRENT_TIMESTAMP - (login_time)::timestamp with time zone)))::integer AS duracao_segundos,
        CASE
            WHEN (last_seen > (CURRENT_TIMESTAMP - '00:10:00'::interval)) THEN 'online'::text
            WHEN (last_seen > (CURRENT_TIMESTAMP - '00:30:00'::interval)) THEN 'idle'::text
            ELSE 'offline'::text
        END AS presence_status
   FROM public.access_logs al
  WHERE ((is_active = true) AND ((status)::text = 'success'::text))
  ORDER BY last_seen DESC;


ALTER VIEW public.vw_active_sessions OWNER TO postgres;

--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 245
-- Name: VIEW vw_active_sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_active_sessions IS 'Sessões ativas com status de presença (online/idle/offline)';


--
-- TOC entry 258 (class 1259 OID 51055)
-- Name: vw_estatisticas_autores; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_estatisticas_autores AS
 SELECT a.id,
    a.nome,
    a.foto_url,
    a.nacionalidade,
    count(aa.id) AS total_avaliacoes,
    COALESCE(avg(aa.nota), (0)::numeric) AS media_notas,
    count(DISTINCT la.livro_id) AS total_livros
   FROM ((public.autor a
     LEFT JOIN public.avaliacoes_autor aa ON ((a.id = aa.autor_id)))
     LEFT JOIN public.livro_autor la ON ((a.id = la.autor_id)))
  GROUP BY a.id, a.nome, a.foto_url, a.nacionalidade;


ALTER VIEW public.vw_estatisticas_autores OWNER TO postgres;

--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 258
-- Name: VIEW vw_estatisticas_autores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_estatisticas_autores IS 'Estatísticas agregadas dos autores (total avaliações, média, total livros)';


--
-- TOC entry 246 (class 1259 OID 42786)
-- Name: vw_login_stats_daily; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_login_stats_daily AS
 SELECT date(login_time) AS data,
    count(*) AS total_logins,
    count(DISTINCT usuario_id) AS usuarios_unicos,
    count(*) FILTER (WHERE ((status)::text = 'success'::text)) AS logins_sucesso,
    count(*) FILTER (WHERE ((status)::text = 'failed'::text)) AS logins_falha,
    avg(session_duration_seconds) FILTER (WHERE (session_duration_seconds IS NOT NULL)) AS duracao_media_segundos
   FROM public.access_logs
  GROUP BY (date(login_time))
  ORDER BY (date(login_time)) DESC;


ALTER VIEW public.vw_login_stats_daily OWNER TO postgres;

--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 246
-- Name: VIEW vw_login_stats_daily; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_login_stats_daily IS 'Estatísticas agregadas de login por dia';


--
-- TOC entry 260 (class 1259 OID 51065)
-- Name: vw_ranking_comentarios_autores; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_ranking_comentarios_autores AS
 SELECT aa.id,
    aa.autor_id,
    aa.usuario_id,
    aa.nota,
    aa.comentario,
    aa.data_criacao,
    count(cc.id) AS total_curtidas,
    count(rc.id) AS total_respostas
   FROM ((public.avaliacoes_autor aa
     LEFT JOIN public.curtidas_comentario cc ON ((((cc.tipo_comentario)::text = 'autor'::text) AND (cc.comentario_id = aa.id))))
     LEFT JOIN public.respostas_comentario rc ON ((((rc.tipo_comentario)::text = 'autor'::text) AND (rc.comentario_id = aa.id))))
  GROUP BY aa.id, aa.autor_id, aa.usuario_id, aa.nota, aa.comentario, aa.data_criacao
  ORDER BY (count(cc.id)) DESC, aa.data_criacao DESC;


ALTER VIEW public.vw_ranking_comentarios_autores OWNER TO postgres;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 260
-- Name: VIEW vw_ranking_comentarios_autores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_ranking_comentarios_autores IS 'Comentários de autores ordenados por número de curtidas';


--
-- TOC entry 259 (class 1259 OID 51060)
-- Name: vw_ranking_comentarios_livros; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_ranking_comentarios_livros AS
 SELECT av.id,
    av.livro_id,
    av.usuario_id,
    av.nota,
    av.comentario,
    av.data_criacao,
    count(cc.id) AS total_curtidas,
    count(rc.id) AS total_respostas
   FROM ((public.avaliacoes av
     LEFT JOIN public.curtidas_comentario cc ON ((((cc.tipo_comentario)::text = 'livro'::text) AND (cc.comentario_id = av.id))))
     LEFT JOIN public.respostas_comentario rc ON ((((rc.tipo_comentario)::text = 'livro'::text) AND (rc.comentario_id = av.id))))
  GROUP BY av.id, av.livro_id, av.usuario_id, av.nota, av.comentario, av.data_criacao
  ORDER BY (count(cc.id)) DESC, av.data_criacao DESC;


ALTER VIEW public.vw_ranking_comentarios_livros OWNER TO postgres;

--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 259
-- Name: VIEW vw_ranking_comentarios_livros; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.vw_ranking_comentarios_livros IS 'Comentários de livros ordenados por número de curtidas';


--
-- TOC entry 247 (class 1259 OID 42791)
-- Name: vw_recent_audit; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_recent_audit AS
 SELECT id,
    usuario_nome,
    usuario_email,
    action,
    categoria,
    descricao,
    target_type,
    target_id,
    criado_em,
    (EXTRACT(epoch FROM (CURRENT_TIMESTAMP - (criado_em)::timestamp with time zone)))::integer AS segundos_atras
   FROM public.audit_trail at
  ORDER BY criado_em DESC
 LIMIT 100;


ALTER VIEW public.vw_recent_audit OWNER TO postgres;

--
-- TOC entry 4961 (class 2604 OID 42707)
-- Name: access_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs ALTER COLUMN id SET DEFAULT nextval('public.access_logs_id_seq'::regclass);


--
-- TOC entry 4993 (class 2604 OID 51142)
-- Name: ai_book_metadata id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_book_metadata ALTER COLUMN id SET DEFAULT nextval('public.ai_book_metadata_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 42734)
-- Name: audit_trail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail ALTER COLUMN id SET DEFAULT nextval('public.audit_trail_id_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 42886)
-- Name: avaliacoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 50994)
-- Name: avaliacoes_autor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes_autor ALTER COLUMN id SET DEFAULT nextval('public.avaliacoes_autor_id_seq'::regclass);


--
-- TOC entry 4983 (class 2604 OID 51021)
-- Name: curtidas_comentario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curtidas_comentario ALTER COLUMN id SET DEFAULT nextval('public.curtidas_comentario_id_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 42557)
-- Name: dominios_permitidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dominios_permitidos ALTER COLUMN id SET DEFAULT nextval('public.dominios_permitidos_id_seq'::regclass);


--
-- TOC entry 4997 (class 2604 OID 51169)
-- Name: integrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations ALTER COLUMN id SET DEFAULT nextval('public.integrations_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 51118)
-- Name: moods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moods ALTER COLUMN id SET DEFAULT nextval('public.moods_id_seq'::regclass);


--
-- TOC entry 4974 (class 2604 OID 42802)
-- Name: notificacao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacao ALTER COLUMN id SET DEFAULT nextval('public.notificacao_id_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 42755)
-- Name: notifications_sent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications_sent ALTER COLUMN id SET DEFAULT nextval('public.notifications_sent_id_seq'::regclass);


--
-- TOC entry 4952 (class 2604 OID 42641)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 4985 (class 2604 OID 51040)
-- Name: respostas_comentario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas_comentario ALTER COLUMN id SET DEFAULT nextval('public.respostas_comentario_id_seq'::regclass);


--
-- TOC entry 4959 (class 2604 OID 42672)
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 42655)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 5369 (class 0 OID 25475)
-- Dependencies: 228
-- Data for Name: Auditoria_Acoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Auditoria_Acoes" VALUES ('5d562cec-8b6e-422d-996a-77f086604cd2', 'Deletou o usuário ''Rafael Martins Souza''', 'DELETE_USUARIO', '2025-06-25 12:25:53.654658-03', '00000000-0000-0000-0000-000000000001');
INSERT INTO public."Auditoria_Acoes" VALUES ('bfcb8218-bdf6-46c4-840c-9bbddb41071e', 'Cadastrou o livro ''O Pequeno Príncipe''', 'CADASTRO_LIVRO', '2025-09-24 00:21:36.526477-03', '00000000-0000-0000-0000-000000000001');
INSERT INTO public."Auditoria_Acoes" VALUES ('5c31e63c-e7e2-4628-b67a-facdba1caf2c', 'Deletou o livro ''O Pequeno Príncipe''', 'DELETE_LIVRO', '2025-09-24 00:21:54.674549-03', '00000000-0000-0000-0000-000000000001');
INSERT INTO public."Auditoria_Acoes" VALUES ('856aa227-f555-4b56-a828-57b1b1730979', 'Cadastrou o livro ''O Pequeno Príncipe''', 'CADASTRO_LIVRO', '2025-10-25 12:30:32.669584-03', '00000000-0000-0000-0000-000000000001');
INSERT INTO public."Auditoria_Acoes" VALUES ('8f7e1bc0-2397-49a2-8d2f-f82694140f7d', 'Deletou o livro ''O Pequeno Príncipe''', 'DELETE_LIVRO', '2025-10-25 12:30:43.506402-03', '00000000-0000-0000-0000-000000000001');


--
-- TOC entry 5368 (class 0 OID 25415)
-- Dependencies: 227
-- Data for Name: Transacao_Financeira; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Transacao_Financeira" VALUES ('84919ef9-6bd6-4be5-8d19-974a4fac857e', 'Multa de atraso', 1.00, 'multa_atraso', '2025-06-24 00:13:33.752128-03', NULL, NULL);
INSERT INTO public."Transacao_Financeira" VALUES ('dc156625-ca22-49c3-9f7a-0a72d0c353d1', 'Orçamento inicial para acervo de 2024', 5000.00, 'orcamento_acervo', '2025-06-24 00:30:33.586358-03', NULL, NULL);
INSERT INTO public."Transacao_Financeira" VALUES ('e51c6394-a726-4d62-9dd8-db2439947791', 'Pagamento de multa - Livro "Eu, Robô"', 7.50, 'multa_atraso', '2025-06-24 00:30:33.586358-03', NULL, NULL);
INSERT INTO public."Transacao_Financeira" VALUES ('b47b72bf-10ca-4d80-9378-a34bac517279', 'Venda de livro duplicado na feira', 15.00, 'venda_livro', '2025-06-24 00:30:33.586358-03', NULL, NULL);
INSERT INTO public."Transacao_Financeira" VALUES ('3ed48318-8133-4582-b115-305345748f57', 'multa do mateus', 0.10, 'multa_atraso', '2025-06-25 20:15:13.829743-03', NULL, NULL);
INSERT INTO public."Transacao_Financeira" VALUES ('505dc403-c764-4160-96f2-9dd0b595f6b0', 'Multa por rasgar o livro', 2.00, 'multa_atraso', '2025-07-10 19:32:38.834122-03', NULL, NULL);
INSERT INTO public."Transacao_Financeira" VALUES ('9f9baebf-e3bb-4de2-93c8-09ec5e976750', 'teste', 1.50, 'orcamento_acervo', '2025-08-06 20:09:55.086614-03', NULL, NULL);


--
-- TOC entry 5381 (class 0 OID 42704)
-- Dependencies: 240
-- Data for Name: access_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.access_logs VALUES (10, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-10 20:42:43.8955', NULL, '2025-11-10 20:42:43.8955', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 20:42:43.8955', '2025-11-10 20:42:43.8955');
INSERT INTO public.access_logs VALUES (20, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-10 21:26:51.1816', NULL, '2025-11-10 21:29:23.877692', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:26:51.1816', '2025-11-10 21:29:23.877692');
INSERT INTO public.access_logs VALUES (22, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://adjoriparana.com.br/wp-content/uploads/Inscricoes-para-o-programa-Aluno-Monitor-da-rede-estadual-de-ensino-ja-estao-abertas.webp', '2025-11-10 21:29:45.965448', NULL, '2025-11-10 21:29:45.965448', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:29:45.965448', '2025-11-10 21:29:45.965448');
INSERT INTO public.access_logs VALUES (11, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-10 20:46:38.057181', '2025-11-10 20:47:55.226822', '2025-11-10 20:47:19.821744', 77, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2025-11-10 20:46:38.057181', '2025-11-10 20:47:55.226822');
INSERT INTO public.access_logs VALUES (12, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://adjoriparana.com.br/wp-content/uploads/Inscricoes-para-o-programa-Aluno-Monitor-da-rede-estadual-de-ensino-ja-estao-abertas.webp', '2025-11-10 20:48:04.831151', NULL, '2025-11-10 20:48:04.831151', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 20:48:04.831151', '2025-11-10 20:48:04.831151');
INSERT INTO public.access_logs VALUES (23, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-10 22:34:27.598444', NULL, '2025-11-10 22:34:27.598444', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 22:34:27.598444', '2025-11-10 22:34:27.598444');
INSERT INTO public.access_logs VALUES (24, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-10 22:36:33.722907', NULL, '2025-11-10 22:36:33.722907', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 22:36:33.722907', '2025-11-10 22:36:33.722907');
INSERT INTO public.access_logs VALUES (25, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-11 00:23:36.904968', NULL, '2025-11-11 00:23:36.904968', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 00:23:36.904968', '2025-11-11 00:23:36.904968');
INSERT INTO public.access_logs VALUES (63, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:39:06.666524', NULL, '2025-11-16 13:39:06.666524', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:39:06.666524', '2025-11-16 13:39:06.666524');
INSERT INTO public.access_logs VALUES (65, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:44:08.63907', NULL, '2025-11-16 13:44:08.63907', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:44:08.63907', '2025-11-16 13:44:08.63907');
INSERT INTO public.access_logs VALUES (67, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:53:10.556311', NULL, '2025-11-16 13:53:10.556311', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:53:10.556311', '2025-11-16 13:53:10.556311');
INSERT INTO public.access_logs VALUES (68, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:53:13.973164', NULL, '2025-11-16 13:53:13.973164', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:53:13.973164', '2025-11-16 13:53:13.973164');
INSERT INTO public.access_logs VALUES (70, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 19:00:01.878067', NULL, '2025-11-16 19:00:01.878067', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 19:00:01.878067', '2025-11-16 19:00:01.878067');
INSERT INTO public.access_logs VALUES (109, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:12:41.703372', NULL, '2026-04-12 18:12:41.703372', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:12:41.703372', '2026-04-12 18:12:41.703372');
INSERT INTO public.access_logs VALUES (75, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-17 20:35:46.307443', NULL, '2025-11-17 20:49:39.577953', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-17 20:35:46.307443', '2025-11-17 20:49:39.577953');
INSERT INTO public.access_logs VALUES (26, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-11 00:33:12.717657', '2025-11-11 00:51:44.241861', '2025-11-11 00:50:53.242917', 1112, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2025-11-11 00:33:12.717657', '2025-11-11 00:51:44.241861');
INSERT INTO public.access_logs VALUES (27, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 00:52:12.118314', NULL, '2025-11-11 00:52:12.118314', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 00:52:12.118314', '2025-11-11 00:52:12.118314');
INSERT INTO public.access_logs VALUES (28, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-11 01:03:37.765592', NULL, '2025-11-11 01:03:37.765592', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 01:03:37.765592', '2025-11-11 01:03:37.765592');
INSERT INTO public.access_logs VALUES (29, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 01:06:04.33121', NULL, '2025-11-11 01:06:04.33121', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 01:06:04.33121', '2025-11-11 01:06:04.33121');
INSERT INTO public.access_logs VALUES (30, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 01:10:16.791248', NULL, '2025-11-11 01:10:16.791248', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 01:10:16.791248', '2025-11-11 01:10:16.791248');
INSERT INTO public.access_logs VALUES (13, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-10 20:51:51.98328', NULL, '2025-11-10 21:04:24.056394', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 20:51:51.98328', '2025-11-10 21:04:24.056394');
INSERT INTO public.access_logs VALUES (31, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:20:46.616984', NULL, '2025-11-11 19:20:46.616984', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:20:46.616984', '2025-11-11 19:20:46.616984');
INSERT INTO public.access_logs VALUES (32, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:21:15.337118', NULL, '2025-11-11 19:21:15.337118', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:21:15.337118', '2025-11-11 19:21:15.337118');
INSERT INTO public.access_logs VALUES (33, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:30:25.172988', NULL, '2025-11-11 19:30:25.172988', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:30:25.172988', '2025-11-11 19:30:25.172988');
INSERT INTO public.access_logs VALUES (15, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-10 21:14:33.261849', NULL, '2025-11-10 21:14:33.261849', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:14:33.261849', '2025-11-10 21:14:33.261849');
INSERT INTO public.access_logs VALUES (16, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-10 21:15:47.239702', NULL, '2025-11-10 21:15:47.239702', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:15:47.239702', '2025-11-10 21:15:47.239702');
INSERT INTO public.access_logs VALUES (14, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-10 21:04:43.21712', '2025-11-10 21:19:59.992423', '2025-11-10 21:13:26.011748', 917, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2025-11-10 21:04:43.21712', '2025-11-10 21:19:59.992423');
INSERT INTO public.access_logs VALUES (17, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://adjoriparana.com.br/wp-content/uploads/Inscricoes-para-o-programa-Aluno-Monitor-da-rede-estadual-de-ensino-ja-estao-abertas.webp', '2025-11-10 21:22:17.01477', NULL, '2025-11-10 21:22:17.01477', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:22:17.01477', '2025-11-10 21:22:17.01477');
INSERT INTO public.access_logs VALUES (18, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://adjoriparana.com.br/wp-content/uploads/Inscricoes-para-o-programa-Aluno-Monitor-da-rede-estadual-de-ensino-ja-estao-abertas.webp', '2025-11-10 21:23:39.286544', NULL, '2025-11-10 21:23:39.286544', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:23:39.286544', '2025-11-10 21:23:39.286544');
INSERT INTO public.access_logs VALUES (19, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://adjoriparana.com.br/wp-content/uploads/Inscricoes-para-o-programa-Aluno-Monitor-da-rede-estadual-de-ensino-ja-estao-abertas.webp', '2025-11-10 21:25:51.679211', NULL, '2025-11-10 21:25:51.679211', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:25:51.679211', '2025-11-10 21:25:51.679211');
INSERT INTO public.access_logs VALUES (21, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-10 21:28:28.112853', NULL, '2025-11-10 21:28:28.112853', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-10 21:28:28.112853', '2025-11-10 21:28:28.112853');
INSERT INTO public.access_logs VALUES (72, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 19:21:34.347254', '2025-11-16 21:46:42.78467', '2025-11-16 21:46:22.234611', 8708, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2025-11-16 19:21:34.347254', '2025-11-16 21:46:42.78467');
INSERT INTO public.access_logs VALUES (73, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-16 21:47:08.158408', NULL, '2025-11-16 21:47:13.190307', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 21:47:08.158408', '2025-11-16 21:47:13.190307');
INSERT INTO public.access_logs VALUES (80, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-26 13:03:11.549514', NULL, '2025-11-26 21:02:40.133349', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-26 13:03:11.549514', '2025-11-26 21:02:40.133349');
INSERT INTO public.access_logs VALUES (34, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:40:02.272296', NULL, '2025-11-11 19:40:02.272296', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:40:02.272296', '2025-11-11 19:40:02.272296');
INSERT INTO public.access_logs VALUES (35, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:40:15.894179', NULL, '2025-11-11 19:40:15.894179', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:40:15.894179', '2025-11-11 19:40:15.894179');
INSERT INTO public.access_logs VALUES (36, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:40:42.397339', NULL, '2025-11-11 19:40:42.397339', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:40:42.397339', '2025-11-11 19:40:42.397339');
INSERT INTO public.access_logs VALUES (37, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-11 19:41:48.276149', NULL, '2025-11-11 19:41:48.276149', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:41:48.276149', '2025-11-11 19:41:48.276149');
INSERT INTO public.access_logs VALUES (38, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-11 19:42:22.948293', NULL, '2025-11-11 19:42:22.948293', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:42:22.948293', '2025-11-11 19:42:22.948293');
INSERT INTO public.access_logs VALUES (39, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 19:44:07.118184', NULL, '2025-11-11 19:44:07.118184', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:44:07.118184', '2025-11-11 19:44:07.118184');
INSERT INTO public.access_logs VALUES (64, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:40:15.995695', NULL, '2025-11-16 13:40:15.995695', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:40:15.995695', '2025-11-16 13:40:15.995695');
INSERT INTO public.access_logs VALUES (66, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:45:34.894595', NULL, '2025-11-16 13:45:34.894595', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:45:34.894595', '2025-11-16 13:45:34.894595');
INSERT INTO public.access_logs VALUES (69, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 13:57:12.124579', NULL, '2025-11-16 13:57:12.124579', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 13:57:12.124579', '2025-11-16 13:57:12.124579');
INSERT INTO public.access_logs VALUES (40, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-11 19:49:23.980202', '2025-11-11 19:50:41.128988', '2025-11-11 19:50:30.052424', 77, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2025-11-11 19:49:23.980202', '2025-11-11 19:50:41.128988');
INSERT INTO public.access_logs VALUES (41, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-11 19:56:58.081205', NULL, '2025-11-11 19:56:58.081205', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 19:56:58.081205', '2025-11-11 19:56:58.081205');
INSERT INTO public.access_logs VALUES (42, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-11 20:54:48.551058', NULL, '2025-11-11 20:54:48.551058', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 20:54:48.551058', '2025-11-11 20:54:48.551058');
INSERT INTO public.access_logs VALUES (71, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 19:03:39.410136', NULL, '2025-11-16 19:03:39.410136', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 19:03:39.410136', '2025-11-16 19:03:39.410136');
INSERT INTO public.access_logs VALUES (124, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-27 21:19:44.62995', NULL, '2026-04-27 21:19:44.62995', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-27 21:19:44.62995', '2026-04-27 21:19:44.62995');
INSERT INTO public.access_logs VALUES (43, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-11 20:56:08.566195', NULL, '2025-11-11 21:15:27.063956', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-11 20:56:08.566195', '2025-11-11 21:15:27.063956');
INSERT INTO public.access_logs VALUES (44, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-12 13:17:21.432121', NULL, '2025-11-12 13:17:21.432121', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-12 13:17:21.432121', '2025-11-12 13:17:21.432121');
INSERT INTO public.access_logs VALUES (45, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-15 15:10:55.511547', NULL, '2025-11-15 15:25:39.555843', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 15:10:55.511547', '2025-11-15 15:25:39.555843');
INSERT INTO public.access_logs VALUES (46, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-15 15:26:03.290926', NULL, '2025-11-15 15:26:47.773418', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 15:26:03.290926', '2025-11-15 15:26:47.773418');
INSERT INTO public.access_logs VALUES (47, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-15 15:26:54.025515', NULL, '2025-11-15 15:26:54.025515', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 15:26:54.025515', '2025-11-15 15:26:54.025515');
INSERT INTO public.access_logs VALUES (48, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-15 15:37:54.015377', NULL, '2025-11-15 15:37:54.015377', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 15:37:54.015377', '2025-11-15 15:37:54.015377');
INSERT INTO public.access_logs VALUES (49, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-15 15:49:45.056157', NULL, '2025-11-15 15:49:45.056157', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 15:49:45.056157', '2025-11-15 15:49:45.056157');
INSERT INTO public.access_logs VALUES (50, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-15 15:51:27.619592', NULL, '2025-11-15 15:51:27.619592', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 15:51:27.619592', '2025-11-15 15:51:27.619592');
INSERT INTO public.access_logs VALUES (51, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-11-15 16:37:07.787484', NULL, '2025-11-15 16:37:07.787484', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 16:37:07.787484', '2025-11-15 16:37:07.787484');
INSERT INTO public.access_logs VALUES (52, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-15 17:01:40.690667', NULL, '2025-11-15 17:01:40.690667', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 17:01:40.690667', '2025-11-15 17:01:40.690667');
INSERT INTO public.access_logs VALUES (53, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-15 17:06:52.5977', NULL, '2025-11-15 17:06:52.5977', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-15 17:06:52.5977', '2025-11-15 17:06:52.5977');
INSERT INTO public.access_logs VALUES (54, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 11:54:34.072501', NULL, '2025-11-16 11:54:34.072501', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 11:54:34.072501', '2025-11-16 11:54:34.072501');
INSERT INTO public.access_logs VALUES (55, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 12:04:03.295951', NULL, '2025-11-16 12:04:03.295951', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:04:03.295951', '2025-11-16 12:04:03.295951');
INSERT INTO public.access_logs VALUES (56, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 12:08:48.82928', NULL, '2025-11-16 12:08:48.82928', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:08:48.82928', '2025-11-16 12:08:48.82928');
INSERT INTO public.access_logs VALUES (57, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 12:12:22.75616', NULL, '2025-11-16 12:12:22.75616', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:12:22.75616', '2025-11-16 12:12:22.75616');
INSERT INTO public.access_logs VALUES (58, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 12:14:21.183697', NULL, '2025-11-16 12:14:21.183697', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:14:21.183697', '2025-11-16 12:14:21.183697');
INSERT INTO public.access_logs VALUES (59, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-16 12:15:00.388439', NULL, '2025-11-16 12:16:46.28192', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:15:00.388439', '2025-11-16 12:16:46.28192');
INSERT INTO public.access_logs VALUES (74, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-17 19:39:57.316234', NULL, '2025-11-17 20:35:29.658801', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-17 19:39:57.316234', '2025-11-17 20:35:29.658801');
INSERT INTO public.access_logs VALUES (60, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-11-16 12:17:47.243965', NULL, '2025-11-16 12:29:27.255162', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:17:47.243965', '2025-11-16 12:29:27.255162');
INSERT INTO public.access_logs VALUES (61, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 12:30:01.573609', NULL, '2025-11-16 12:30:01.573609', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:30:01.573609', '2025-11-16 12:30:01.573609');
INSERT INTO public.access_logs VALUES (62, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-16 12:30:01.939099', NULL, '2025-11-16 12:30:01.939099', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-16 12:30:01.939099', '2025-11-16 12:30:01.939099');
INSERT INTO public.access_logs VALUES (97, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 10:56:21.312682', NULL, '2025-12-17 11:01:40.156252', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 10:56:21.312682', '2025-12-17 11:01:40.156252');
INSERT INTO public.access_logs VALUES (83, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:17:47.284407', NULL, '2025-12-16 21:24:43.420839', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:17:47.284407', '2025-12-16 21:24:43.420839');
INSERT INTO public.access_logs VALUES (105, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 15:22:46.937276', NULL, '2025-12-17 15:23:47.753436', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:22:46.937276', '2025-12-17 15:23:47.753436');
INSERT INTO public.access_logs VALUES (98, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 11:01:49.061022', NULL, '2025-12-17 11:05:26.192628', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 11:01:49.061022', '2025-12-17 11:05:26.192628');
INSERT INTO public.access_logs VALUES (90, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-12-17 09:35:01.062241', NULL, '2025-12-17 09:59:13.958951', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 09:35:01.062241', '2025-12-17 09:59:13.958951');
INSERT INTO public.access_logs VALUES (81, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:02:10.640451', NULL, '2025-12-16 21:12:02.415045', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:02:10.640451', '2025-12-16 21:12:02.415045');
INSERT INTO public.access_logs VALUES (101, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 13:50:53.209506', NULL, '2025-12-17 15:26:36.218228', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 13:50:53.209506', '2025-12-17 15:26:36.218228');
INSERT INTO public.access_logs VALUES (82, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:15:54.21966', NULL, '2025-12-16 21:17:16.438988', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:15:54.21966', '2025-12-16 21:17:16.438988');
INSERT INTO public.access_logs VALUES (76, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-17 20:49:45.004513', '2025-11-17 21:02:59.859499', '2025-11-17 21:02:26.672494', 795, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2025-11-17 20:49:45.004513', '2025-11-17 21:02:59.859499');
INSERT INTO public.access_logs VALUES (106, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-12-17 15:24:11.994031', NULL, '2025-12-17 15:29:47.171621', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:24:11.994031', '2025-12-17 15:29:47.171621');
INSERT INTO public.access_logs VALUES (84, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:25:02.279244', NULL, '2025-12-16 21:43:51.493859', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:25:02.279244', '2025-12-16 21:43:51.493859');
INSERT INTO public.access_logs VALUES (77, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-17 21:03:11.831081', NULL, '2025-11-17 23:11:40.885181', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-17 21:03:11.831081', '2025-11-17 23:11:40.885181');
INSERT INTO public.access_logs VALUES (78, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-18 20:33:24.643325', NULL, '2025-11-18 21:45:45.854445', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-18 20:33:24.643325', '2025-11-18 21:45:45.854445');
INSERT INTO public.access_logs VALUES (91, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-12-17 09:59:23.251541', NULL, '2025-12-17 10:17:16.728834', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 09:59:23.251541', '2025-12-17 10:17:16.728834');
INSERT INTO public.access_logs VALUES (79, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-11-26 12:59:33.807662', NULL, '2025-11-26 13:02:55.261881', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-11-26 12:59:33.807662', '2025-11-26 13:02:55.261881');
INSERT INTO public.access_logs VALUES (85, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:44:04.972879', NULL, '2025-12-16 21:50:38.35775', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:44:04.972879', '2025-12-16 21:50:38.35775');
INSERT INTO public.access_logs VALUES (86, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:51:30.527603', NULL, '2025-12-16 21:51:30.527603', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:51:30.527603', '2025-12-16 21:51:30.527603');
INSERT INTO public.access_logs VALUES (99, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 11:05:46.117848', NULL, '2025-12-17 11:28:46.982196', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 11:05:46.117848', '2025-12-17 11:28:46.982196');
INSERT INTO public.access_logs VALUES (92, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-17 10:17:40.665061', NULL, '2025-12-17 10:25:46.494536', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 10:17:40.665061', '2025-12-17 10:25:46.494536');
INSERT INTO public.access_logs VALUES (93, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-17 10:25:53.386699', NULL, '2025-12-17 10:27:43.819809', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 10:25:53.386699', '2025-12-17 10:27:43.819809');
INSERT INTO public.access_logs VALUES (87, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-16 21:51:34.431786', NULL, '2025-12-16 22:56:27.422894', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-16 21:51:34.431786', '2025-12-16 22:56:27.422894');
INSERT INTO public.access_logs VALUES (107, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-12-17 15:30:27.743514', NULL, '2025-12-17 15:38:52.248745', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:30:27.743514', '2025-12-17 15:38:52.248745');
INSERT INTO public.access_logs VALUES (102, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 15:04:39.629179', NULL, '2025-12-17 15:39:43.792784', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:04:39.629179', '2025-12-17 15:39:43.792784');
INSERT INTO public.access_logs VALUES (100, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 13:43:52.020379', NULL, '2025-12-17 13:50:03.739094', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 13:43:52.020379', '2025-12-17 13:50:03.739094');
INSERT INTO public.access_logs VALUES (94, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 10:27:46.586248', NULL, '2025-12-17 10:47:32.672095', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 10:27:46.586248', '2025-12-17 10:47:32.672095');
INSERT INTO public.access_logs VALUES (108, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-12-17 15:39:50.96645', NULL, '2025-12-17 16:08:49.155381', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:39:50.96645', '2025-12-17 16:08:49.155381');
INSERT INTO public.access_logs VALUES (88, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-17 08:19:08.355297', NULL, '2025-12-17 09:26:00.507809', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 08:19:08.355297', '2025-12-17 09:26:00.507809');
INSERT INTO public.access_logs VALUES (95, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2025-12-17 10:48:05.017027', NULL, '2025-12-17 10:51:27.158531', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 10:48:05.017027', '2025-12-17 10:51:27.158531');
INSERT INTO public.access_logs VALUES (89, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2025-12-17 09:26:13.151799', NULL, '2025-12-17 09:34:43.175496', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 09:26:13.151799', '2025-12-17 09:34:43.175496');
INSERT INTO public.access_logs VALUES (110, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:12:49.998042', NULL, '2026-04-12 18:31:53.932778', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:12:49.998042', '2026-04-12 18:31:53.932778');
INSERT INTO public.access_logs VALUES (96, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 10:51:41.431158', NULL, '2025-12-17 10:56:13.113987', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 10:51:41.431158', '2025-12-17 10:56:13.113987');
INSERT INTO public.access_logs VALUES (103, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 15:14:38.44956', NULL, '2025-12-17 15:22:25.944218', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:14:38.44956', '2025-12-17 15:22:25.944218');
INSERT INTO public.access_logs VALUES (104, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2025-12-17 15:22:37.647937', NULL, '2025-12-17 15:22:42.679866', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2025-12-17 15:22:37.647937', '2025-12-17 15:22:42.679866');
INSERT INTO public.access_logs VALUES (111, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:16:18.169053', NULL, '2026-04-12 18:16:18.169053', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:16:18.169053', '2026-04-12 18:16:18.169053');
INSERT INTO public.access_logs VALUES (112, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2026-04-12 18:20:23.840285', NULL, '2026-04-12 18:20:59.129212', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:20:23.840285', '2026-04-12 18:20:59.129212');
INSERT INTO public.access_logs VALUES (141, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-04 20:51:30.064339', NULL, '2026-05-05 04:51:06.714943', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-04 20:51:30.064339', '2026-05-05 04:51:06.714943');
INSERT INTO public.access_logs VALUES (113, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:21:43.618834', NULL, '2026-04-12 18:21:48.667249', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:21:43.618834', '2026-04-12 18:21:48.667249');
INSERT INTO public.access_logs VALUES (114, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:23:43.150416', NULL, '2026-04-12 18:23:43.150416', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:23:43.150416', '2026-04-12 18:23:43.150416');
INSERT INTO public.access_logs VALUES (115, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2026-04-12 18:30:47.122718', NULL, '2026-04-12 18:30:47.122718', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:30:47.122718', '2026-04-12 18:30:47.122718');
INSERT INTO public.access_logs VALUES (117, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:34:53.026445', NULL, '2026-04-12 18:34:53.026445', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:34:53.026445', '2026-04-12 18:34:53.026445');
INSERT INTO public.access_logs VALUES (116, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:32:03.766948', NULL, '2026-04-12 18:35:33.683758', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:32:03.766948', '2026-04-12 18:35:33.683758');
INSERT INTO public.access_logs VALUES (128, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-28 06:58:52.292796', '2026-04-28 07:09:08.608402', '2026-04-28 07:08:37.991332', 616, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2026-04-28 06:58:52.292796', '2026-04-28 07:09:08.608402');
INSERT INTO public.access_logs VALUES (136, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-30 22:10:00.469097', NULL, '2026-05-01 02:29:18.642099', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-30 22:10:00.469097', '2026-05-01 02:29:18.642099');
INSERT INTO public.access_logs VALUES (118, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:35:41.797102', NULL, '2026-04-12 18:36:52.244711', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:35:41.797102', '2026-04-12 18:36:52.244711');
INSERT INTO public.access_logs VALUES (120, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:41:07.4237', NULL, '2026-04-12 18:41:07.4237', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:41:07.4237', '2026-04-12 18:41:07.4237');
INSERT INTO public.access_logs VALUES (121, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:41:07.83326', NULL, '2026-04-12 18:41:07.83326', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:41:07.83326', '2026-04-12 18:41:07.83326');
INSERT INTO public.access_logs VALUES (119, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:40:18.094267', NULL, '2026-04-12 18:41:16.947636', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:40:18.094267', '2026-04-12 18:41:16.947636');
INSERT INTO public.access_logs VALUES (129, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-28 18:33:51.272377', NULL, '2026-04-28 18:41:12.031518', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-28 18:33:51.272377', '2026-04-28 18:41:12.031518');
INSERT INTO public.access_logs VALUES (131, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-28 18:44:15.066771', NULL, '2026-04-28 19:56:40.143269', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-28 18:44:15.066771', '2026-04-28 19:56:40.143269');
INSERT INTO public.access_logs VALUES (122, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-12 18:41:31.513998', NULL, '2026-04-12 18:43:43.623594', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:41:31.513998', '2026-04-12 18:43:43.623594');
INSERT INTO public.access_logs VALUES (130, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-28 18:41:28.912442', '2026-04-28 18:44:01.879068', '2026-04-28 18:44:00.830379', 153, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2026-04-28 18:41:28.912442', '2026-04-28 18:44:01.879068');
INSERT INTO public.access_logs VALUES (142, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-05 21:07:13.984365', NULL, '2026-05-05 21:24:46.527333', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-05 21:07:13.984365', '2026-05-05 21:24:46.527333');
INSERT INTO public.access_logs VALUES (143, '00000000-0000-0000-0000-000000000001', 'admin.teste@email.com', 'Admin Teste', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', '2026-05-09 18:08:18.416428', NULL, '2026-05-10 02:07:42.079967', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-09 18:08:18.416428', '2026-05-10 02:07:42.079967');
INSERT INTO public.access_logs VALUES (144, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-10 19:36:08.55471', NULL, '2026-05-11 03:35:36.110054', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-10 19:36:08.55471', '2026-05-11 03:35:36.110054');
INSERT INTO public.access_logs VALUES (134, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-29 23:07:57.908003', NULL, '2026-04-30 05:21:42.89401', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-29 23:07:57.908003', '2026-04-30 05:21:42.89401');
INSERT INTO public.access_logs VALUES (138, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-01 16:17:42.304887', NULL, '2026-05-01 21:10:11.161919', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-01 16:17:42.304887', '2026-05-01 21:10:11.161919');
INSERT INTO public.access_logs VALUES (132, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-28 19:57:42.001496', NULL, '2026-04-28 20:30:33.579015', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-28 19:57:42.001496', '2026-04-28 20:30:33.579015');
INSERT INTO public.access_logs VALUES (135, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-30 20:30:51.934412', NULL, '2026-04-30 22:07:05.421626', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-30 20:30:51.934412', '2026-04-30 22:07:05.421626');
INSERT INTO public.access_logs VALUES (133, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-28 20:30:42.782934', NULL, '2026-04-28 21:06:31.379425', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-28 20:30:42.782934', '2026-04-28 21:06:31.379425');
INSERT INTO public.access_logs VALUES (137, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-01 09:45:55.311639', NULL, '2026-05-01 11:48:29.307148', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-01 09:45:55.311639', '2026-05-01 11:48:29.307148');
INSERT INTO public.access_logs VALUES (127, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-27 21:29:58.825038', NULL, '2026-04-28 05:29:35.049635', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-27 21:29:58.825038', '2026-04-28 05:29:35.049635');
INSERT INTO public.access_logs VALUES (123, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-04-12 18:43:48.484049', NULL, '2026-04-13 02:42:56.031048', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-12 18:43:48.484049', '2026-04-13 02:42:56.031048');
INSERT INTO public.access_logs VALUES (125, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-27 21:22:45.115615', NULL, '2026-04-27 21:22:45.115615', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-27 21:22:45.115615', '2026-04-27 21:22:45.115615');
INSERT INTO public.access_logs VALUES (139, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-01 21:10:35.46142', '2026-05-01 21:14:39.4762', '2026-05-01 21:14:24.194007', 244, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2026-05-01 21:10:35.46142', '2026-05-01 21:14:39.4762');
INSERT INTO public.access_logs VALUES (145, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-05-15 19:37:44.202797', '2026-05-15 19:52:34.664268', '2026-05-15 19:52:23.679624', 890, 'success', NULL, '::1', NULL, NULL, NULL, NULL, false, '2026-05-15 19:37:44.202797', '2026-05-15 19:52:34.664268');
INSERT INTO public.access_logs VALUES (140, '79423106-73b8-4c44-b803-f01333b4c9bb', 'admin@bibliotech.com', 'Administrador do Sistema', NULL, '2026-05-01 21:15:32.285003', NULL, '2026-05-01 21:16:49.769394', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-05-01 21:15:32.285003', '2026-05-01 21:16:49.769394');
INSERT INTO public.access_logs VALUES (126, '00000000-0000-0000-0000-000000000002', 'aluno.teste@email.com', 'Aluno Teste', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', '2026-04-27 21:23:47.975946', NULL, '2026-04-27 21:29:52.280547', NULL, 'success', NULL, '::1', NULL, NULL, NULL, NULL, true, '2026-04-27 21:23:47.975946', '2026-04-27 21:29:52.280547');


--
-- TOC entry 5401 (class 0 OID 51139)
-- Dependencies: 266
-- Data for Name: ai_book_metadata; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5383 (class 0 OID 42731)
-- Dependencies: 242
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5360 (class 0 OID 25268)
-- Dependencies: 219
-- Data for Name: autor; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.autor VALUES ('2be4da4b-25bd-4796-ace3-58a11ce3bf3c', 'Isaac Asimov', 'Cientista e escritor de ficção científica, notável pelas “Leis da Robótica” e séries “Fundação” e “Robôs”. Popularizou ciência em ensaios acessíveis e livros de divulgação. Sua prosa clara discute ética, tecnologia e organização social. É referência central do gênero no século XX.', '1920-01-02', 'Americano', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRriJBeKWVfKx26i1IHmw76Y-v955MPWirlew&s');
INSERT INTO public.autor VALUES ('f85b2a0a-e979-4ac9-b3d9-cb768c175c7b', 'Machado de assis', 'Maior nome da literatura brasileira, autor de “Memórias Póstumas de Brás Cubas” e “Dom Casmurro”. Inovou na ironia, no narrador pouco confiável e na crítica de costumes. Fundador da Academia Brasileira de Letras, retratou com sutileza a sociedade carioca do século XIX.', '1839-06-21', 'Brasileiro', 'https://upload.wikimedia.org/wikipedia/commons/4/40/Machado_de_Assis_aos_57_anos.jpg');
INSERT INTO public.autor VALUES ('0f72ad62-d53c-46ab-99ee-477e3834ebcb', 'George Orwell', 'Escritor e jornalista britânico, autor de “1984” e “A Revolução dos Bichos”. Denunciou autoritarismos, manipulação da linguagem e vigilância de Estado. Seu estilo direto e ensaístico influenciou o pensamento político contemporâneo.', '1903-06-25', 'Britânico', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/George_Orwell_press_photo.jpg/960px-George_Orwell_press_photo.jpg');
INSERT INTO public.autor VALUES ('850eade9-c5df-4b33-a766-4856111af7a4', 'José de Alencar', 'Romancista do Romantismo brasileiro, autor de “Iracema”, “O Guarani” e “Senhora”. Construiu mitos de origem e retratos da sociedade oitocentista. Atuou como jornalista e político, sendo marco na formação da prosa nacional.', '1829-05-01', 'Brasileiro', 'https://academiacearensedeletras.org.br/wp-content/uploads/2020/11/JOSE-DE-ALENCAR.jpg');
INSERT INTO public.autor VALUES ('66666666-6666-6666-6666-666666666666', 'Aluísio Azevedo', 'Escritor naturalista brasileiro, autor de “O Cortiço”. Retratou determinismo social, urbanização e tensões raciais com olhar crítico. Sua obra consolidou o Naturalismo no Brasil no fim do século XIX.', '1857-04-14', 'Brasileiro', 'https://www2.camara.leg.br/a-camara/visiteacamara/cultura-na-camara/imagens/exposicoes-historicas-e-artisticas-2017/aluisio-azevedo/image_large');
INSERT INTO public.autor VALUES ('a9c2ff15-c5dd-4a65-a777-d223dd434e45', 'Anne Frank', 'Jovem autora do diário escrito no esconderijo em Amsterdã durante a ocupação nazista. Seu testemunho tornou-se símbolo universal da memória do Holocausto. A escrita revela maturidade, esperança e humanidade em meio à perseguição.', '1929-06-12', 'Alemã', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Anne_Frank_lacht_naar_de_schoolfotograaf_%28cropped%29.jpg/960px-Anne_Frank_lacht_naar_de_schoolfotograaf_%28cropped%29.jpg');
INSERT INTO public.autor VALUES ('41792d29-c3b2-44f5-9f97-d6288232d0a1', 'Bram Stoker', 'Romancista irlandês conhecido por “Drácula”, que consolidou o vampiro moderno na literatura. Misturou cartas, diários e recortes em narrativa epistolar. Sua criação influenciou cinema, teatro e cultura pop por gerações.', '1847-11-08', 'Irlandês', 'https://upload.wikimedia.org/wikipedia/commons/3/34/Bram_Stoker_1906.jpg');
INSERT INTO public.autor VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mary Shelley', 'Autora de “Frankenstein”, obra fundadora da ficção científica e do gótico moderno. Refletiu sobre ciência, responsabilidade e criação. Sua imaginação filosófica marcou profundamente a literatura do século XIX.', '1797-08-30', 'Britânica', NULL);
INSERT INTO public.autor VALUES ('5a452ae0-54fa-4a46-81ec-fbdd550f307b', 'William Shakespeare', 'Dramaturgo e poeta do período elisabetano, considerado o maior escritor da língua inglesa. Autor de tragédias e comédias como “Hamlet”, “Macbeth” e “Romeu e Julieta”. Sua obra explora poder, ambição, amor e a condição humana, influenciando a literatura e o teatro até hoje.', '1564-04-23', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('8fda8c42-c2f8-4174-b35c-897087a77fef', 'Agatha Christie', 'Escritora conhecida como a Rainha do Crime, criou detetives como Hercule Poirot e Miss Marple. Publicou dezenas de romances e peças famosas, incluindo “A Ratoeira”. Suas tramas são marcadas por pistas sutis e reviravoltas engenhosas.', '1890-09-15', 'Britânica', NULL);
INSERT INTO public.autor VALUES ('99999999-9999-9999-9999-999999999999', 'Jane Austen', 'Romancista inglesa do período regencial, autora de “Orgulho e Preconceito” e “Razão e Sensibilidade”. Com humor e crítica social, explorou casamento, classe e independência feminina. Sua prosa elegante permanece amplamente lida.', '1775-12-16', 'Britânica', NULL);
INSERT INTO public.autor VALUES ('282719cf-b134-44a8-a529-f338eee2acbb', 'Emily Brontë', 'Poeta e romancista, autora de “O Morro dos Ventos Uivantes”. Construiu um drama intenso sobre paixão, natureza e destino. Sua obra única tornou-se pilar do cânone inglês.', '1818-07-30', 'Britânica', NULL);
INSERT INTO public.autor VALUES ('44444444-4444-4444-4444-444444444444', 'Jorge Amado', 'Romancista baiano de grande popularidade, autor de “Gabriela, Cravo e Canela” e “Dona Flor e Seus Dois Maridos”. Retratou o povo, a sensualidade e as contradições sociais do Brasil. Teve obras amplamente adaptadas para cinema e TV.', '1912-08-10', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('56eee620-0414-4432-b8bb-6e298c94f7ac', 'Paulo Coelho', 'Autor de alcance global, conhecido por “O Alquimista”. Explora espiritualidade, busca pessoal e jornadas simbólicas em linguagem acessível. Tornou-se um dos escritores brasileiros mais lidos no mundo.', '1947-08-24', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('da7faa5b-5aee-4925-b3ef-41fed615f5f0', 'Clarice Lispector', 'Escritora de prosa inovadora e introspectiva, autora de “A Paixão Segundo G.H.” e “A Hora da Estrela”. Investigou identidade, linguagem e experiência sensível com estilo singular. Figura essencial da literatura brasileira do século XX.', '1920-12-10', 'Ucraniana/Brasileira', NULL);
INSERT INTO public.autor VALUES ('61a8f93f-8d60-4866-8ea1-728266f98e62', 'Thomas Harris', 'Romancista de suspense, criador de Hannibal Lecter em “O Silêncio dos Inocentes” e obras correlatas. Combina crime, psicologia e atmosfera sombria. Tornou-se referência do thriller contemporâneo, com adaptações premiadas.', '1940-04-11', 'Americano', NULL);
INSERT INTO public.autor VALUES ('88888888-8888-8888-8888-888888888888', 'Markus Zusak', 'Escritor australiano conhecido por “A Menina que Roubava Livros”. Sua narrativa lírica aborda guerra, perda e poder das palavras. Conquistou leitores jovens e adultos ao redor do mundo.', '1975-06-23', 'Australiano', NULL);
INSERT INTO public.autor VALUES ('22222222-2222-2222-2222-222222222222', 'Antoine de Saint-Exupéry', 'Aviador e escritor francês, autor de “O Pequeno Príncipe”. Uniu aventura aérea, reflexão humanista e prosa poética. Sua obra celebra amizade, responsabilidade e aquilo que é invisível aos olhos.', '1900-06-29', 'Francês', NULL);
INSERT INTO public.autor VALUES ('33333333-3333-3333-3333-333333333333', 'Machado de Assis', 'Maior nome da literatura brasileira, autor de “Memórias Póstumas de Brás Cubas” e “Dom Casmurro”. Inovou na ironia, no narrador pouco confiável e na crítica de costumes. Fundador da Academia Brasileira de Letras, retratou com sutileza a sociedade carioca do século XIX.', '1839-06-21', 'Brasileiro', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Machado_de_Assis_1904.jpg/220px-Machado_de_Assis_1904.jpg');
INSERT INTO public.autor VALUES ('532fe53f-e1c2-490c-80bc-3cad716d5638', 'J.K. Rowling', 'Romancista britânica conhecida pela série “Harry Potter”, fenômeno editorial e cultural. Sua obra combinou fantasia, mistério escolar e amadurecimento, alcançando leitores de todas as idades. Participou ativamente de causas sociais por meio de fundações. Também escreveu romances para adultos sob pseudônimo.', '1965-07-31', 'Britânica', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/220px-J._K._Rowling_2010.jpg');
INSERT INTO public.autor VALUES ('55555555-5555-5555-5555-555555555555', 'Franz Kafka', 'Autor de língua alemã nascido em Praga, criador de “A Metamorfose” e “O Processo”. Explorou alienação, burocracia e culpa em narrativas inquietantes. Sua visão deu origem ao adjetivo “kafkiano”.', '1883-07-03', 'Tcheco', NULL);
INSERT INTO public.autor VALUES ('77777777-7777-7777-7777-777777777777', 'J.R.R. Tolkien', 'Filólogo e professor em Oxford, criador de “O Senhor dos Anéis” e do legendário mundo da Terra-média. Com raízes em mitologias nórdicas e filologia, redefiniu a fantasia moderna. Sua obra inspira leitores, jogos e cinema.', '1892-01-03', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('5db90aae-70aa-4265-9cf2-1b96eafd7028', 'Stephen King', 'Romancista prolífico de terror, suspense e fantasia, autor de “It”, “O Iluminado” e “Carrie”. Suas histórias exploram medo, trauma e aspectos sombrios da vida cotidiana. Muitas obras foram adaptadas para cinema e TV.', '1947-09-21', 'Americano', NULL);
INSERT INTO public.autor VALUES ('b18a998b-a8ef-4ab8-855e-44f49dafa16c', 'Leo Tolstoy', 'Romancista e pensador russo, autor de “Guerra e Paz” e “Anna Kariênina”. Sua escrita combina amplitude histórica, análise psicológica e questões morais. Tornou-se crítico social e defensor de uma vida ética e simples.', '1828-09-09', 'Russo', NULL);
INSERT INTO public.autor VALUES ('5fb08353-7a0b-4925-b91a-e320b2ce7409', 'Charles Dickens', 'Figura central do romance vitoriano, autor de “Oliver Twist” e “Grandes Esperanças”. Retratou desigualdade social e infância em situações adversas com humor e compaixão. Sua prosa vívida e seus personagens tornaram-se universais.', '1812-02-07', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('bc0f62b1-7633-4486-afdf-f27ea6bb0995', 'Victor Hugo', 'Poeta, dramaturgo e romancista, autor de “Os Miseráveis” e “O Corcunda de Notre-Dame”. Defensor de causas sociais e da liberdade, uniu imaginação romântica e crítica política. É um símbolo da literatura francesa do século XIX.', '1802-02-26', 'Francês', NULL);
INSERT INTO public.autor VALUES ('9963505a-8986-4da3-b0b3-f7413d844bd8', 'Fyodor Dostoevsky', 'Romancista que investigou culpa, liberdade e fé em obras como “Crime e Castigo” e “Os Irmãos Karamázov”. Suas narrativas profundas exploram dilemas psicológicos e morais. Influenciou filosofia, psicologia e literatura modernas.', '1821-11-11', 'Russo', NULL);
INSERT INTO public.autor VALUES ('a04e8501-8eb6-4610-820f-3dd6495564c7', 'Mark Twain', 'Autor de humor e crítica social, conhecido por “As Aventuras de Tom Sawyer” e “Huckleberry Finn”. Sua prosa coloquial capturou a voz americana do século XIX. Denunciou hipocrisias e injustiças com ironia afiada.', '1835-11-30', 'Americano', NULL);
INSERT INTO public.autor VALUES ('d6d1057b-2b9a-428a-a1c5-02f8c913a74f', 'Ernest Hemingway', 'Romancista e jornalista, mestre do estilo conciso e direto. Autor de “O Velho e o Mar” e “Por Quem os Sinos Dobram”, retratou coragem, perda e dignidade. Recebeu o Nobel de Literatura em 1954.', '1899-07-21', 'Americano', NULL);
INSERT INTO public.autor VALUES ('89756b61-cc97-4022-addc-d247abce5f3d', 'Virginia Woolf', 'Escritora modernista e ensaísta, pioneira do fluxo de consciência. Obras como “Mrs. Dalloway” e “Orlando” exploram subjetividade, tempo e gênero. Referência central no feminismo literário do século XX.', '1882-01-25', 'Britânica', NULL);
INSERT INTO public.autor VALUES ('8b07dc20-6d77-41b6-a00c-c1f1c1456bda', 'Gabriel Garcia Marquez', 'Romancista do realismo mágico, autor de “Cem Anos de Solidão”. Sua escrita mescla cotidiano e fantástico para refletir a história latino-americana. Ganhou o Nobel de Literatura em 1982.', '1927-03-06', 'Colombiano', NULL);
INSERT INTO public.autor VALUES ('158fbca9-ddca-4d60-87c6-29350fbfb718', 'Isabel Allende', 'Romancista de forte presença na literatura latino-americana contemporânea. “A Casa dos Espíritos” combinou saga familiar e realismo mágico. Sua obra discute memória, exílio e resistência.', '1942-08-02', 'Chilena', NULL);
INSERT INTO public.autor VALUES ('16976208-1006-41aa-b989-a43899188bce', 'Haruki Murakami', 'Escritor de prosa hipnótica que mistura surrealismo e cultura pop. Livros como “Kafka à Beira-Mar” e “1Q84” abordam solidão e identidade. Tradutor e corredor, mantém forte diálogo com a música ocidental.', '1949-01-12', 'Japonês', NULL);
INSERT INTO public.autor VALUES ('02994fe6-801b-4ed4-b269-67a97f2d23bd', 'Margaret Atwood', 'Romancista e poeta, autora de “O Conto da Aia”. Explora poder, gênero e ecologia com imaginação distópica e ironia. Ativista cultural, é voz influente no debate contemporâneo.', '1939-11-18', 'Canadense', NULL);
INSERT INTO public.autor VALUES ('b90c4115-689c-4434-8014-e1c69ae0656d', 'Neil Gaiman', 'Autor de fantasia sombria e contos contemporâneos, criador de “Sandman”. Suas obras transitam entre mitologia, fábula e cultura pop. Mantém diálogo próximo com leitores e outras mídias.', '1960-11-10', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('092b1b88-1fb0-42c4-8d98-915e7456ba72', 'Edgar Allan Poe', 'Poeta e contista pioneiro do conto policial e do horror psicológico. “O Corvo” e histórias de detetive influenciaram gerações. Sua estética do macabro moldou a literatura gótica.', '1809-01-19', 'Americano', NULL);
INSERT INTO public.autor VALUES ('692522cd-6230-4db1-b854-634883daa426', 'H.G. Wells', 'Romancista de ficção científica, autor de “A Guerra dos Mundos” e “A Máquina do Tempo”. Usou a imaginação científica para criticar sociedade e imperialismo. Contribuiu para popularizar o gênero no século XX.', '1866-09-21', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('9a5c146b-1f12-42a1-8b0d-ef17e7f60af2', 'Jules Verne', 'Pioneiro da aventura científica, escreveu “Vinte Mil Léguas Submarinas” e “Da Terra à Lua”. Uniu curiosidade tecnológica e espírito exploratório. Sua obra inspirou inventores e viajantes.', '1828-02-08', 'Francês', NULL);
INSERT INTO public.autor VALUES ('0f1b5f93-b796-4f52-b163-aa07d0f78444', 'Arthur Conan Doyle', 'Criador de Sherlock Holmes, marcou a narrativa policial dedutiva. Equilibrou mistério, lógica e observação minuciosa. Também escreveu histórias históricas e de aventura.', '1859-05-22', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('7ad5369a-0ca0-4a8c-a9bc-22e23d704100', 'Alexandre Dumas', 'Romancista popular do século XIX, autor de “Os Três Mosqueteiros” e “O Conde de Monte Cristo”. Suas tramas vibrantes combinam aventura, honra e vingança. Tornou-se ícone da literatura de folhetim.', '1802-07-24', 'Francês', NULL);
INSERT INTO public.autor VALUES ('025e27d2-3580-4da9-ae11-86fb7c581861', 'F. Scott Fitzgerald', 'Cronista da Era do Jazz, autor de “O Grande Gatsby”. Examinou desejo, riqueza e desilusão do sonho americano. Sua prosa elegante tornou-se referência do modernismo norte-americano.', '1896-09-24', 'Americano', NULL);
INSERT INTO public.autor VALUES ('26c065da-7fb1-4f6f-8fd6-8954c84dbfc8', 'John Steinbeck', 'Romancista da realidade social, autor de “As Vinhas da Ira” e “Ratos e Homens”. Retratou trabalhadores e migrantes na Grande Depressão. Ganhou o Nobel de Literatura em 1962.', '1902-02-27', 'Americano', NULL);
INSERT INTO public.autor VALUES ('d18615a8-5431-4a7e-a9f3-8d1469c4fc9f', 'Aldous Huxley', 'Autor de “Admirável Mundo Novo”, uniu distopia e crítica cultural. Explorou ciência, liberdade e condicionamento social. Interessou-se por misticismo e consciência.', '1894-07-26', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('bbbf7c1b-bd4b-4e1d-ba72-d90118662d4f', 'James Joyce', 'Figura central do modernismo, inovou o romance com “Ulisses”. Desenvolveu técnicas como fluxo de consciência e alusão intensiva. Sua obra desafiou convenções de linguagem e narrativa.', '1882-02-02', 'Irlandês', NULL);
INSERT INTO public.autor VALUES ('d4e479d9-7360-4408-8ea6-d2d25d9a8cc7', 'Albert Camus', 'Escritor e ensaísta ligado ao existencialismo, autor de “O Estrangeiro”. Desenvolveu o conceito do absurdo e refletiu sobre ética e revolta. Recebeu o Nobel de Literatura em 1957.', '1913-11-07', 'Francês', NULL);
INSERT INTO public.autor VALUES ('5a3e96ea-45f6-4b2e-aac3-df8984c0cf41', 'Simone de Beauvoir', 'Filósofa e escritora, referência do feminismo com “O Segundo Sexo”. Explorou liberdade, corpo e construção social do gênero. Produziu romances, ensaios e memórias influentes.', '1908-01-09', 'Francesa', NULL);
INSERT INTO public.autor VALUES ('5a047171-a1b4-423b-ac57-1af7e6eabff8', 'Carlos Drummond de Andrade', 'Poeta brasileiro central do século XX, autor de “Alguma Poesia”. Sua voz irônica e reflexiva uniu modernidade e lirismo cotidiano. Marcou gerações com imagens memoráveis e humor contido.', '1902-10-31', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('1fafb8aa-8d8c-4332-a6f5-869b86b9274b', 'Cecília Meireles', 'Poeta, jornalista e educadora, voz lírica de alta musicalidade. Obras como “Romanceiro da Inconfidência” exploram história e transcendência. Defendeu a educação e a cultura no Brasil.', '1901-11-07', 'Brasileira', NULL);
INSERT INTO public.autor VALUES ('8e8c4c49-4de9-4504-941d-f5b7393064fd', 'Mario Quintana', 'Poeta gaúcho de estilo simples e filosófico, mestre do aforismo. Sua poesia trata do cotidiano com humor e delicadeza. Tornou-se presença querida na cultura brasileira.', '1906-07-30', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('11648b5d-c056-4305-bbdd-906ea3d58c09', 'Graciliano Ramos', 'Romancista do regionalismo crítico, autor de “Vidas Secas”. Sua prosa enxuta examina opressão, seca e injustiça social. Foi também memorialista e gestor público.', '1892-10-27', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('eb936366-7768-460a-a5c9-13a78db3da88', 'Rachel de Queiroz', 'Romancista e cronista, pioneira entre mulheres na Academia Brasileira de Letras. “O Quinze” marcou o regionalismo nordestino. Abordou temas sociais com vigor e sensibilidade.', '1910-11-17', 'Brasileira', NULL);
INSERT INTO public.autor VALUES ('2f266d16-6020-44bb-aedb-041d8e38f3b4', 'Érico Veríssimo', 'Romancista gaúcho autor de “O Tempo e o Vento”. Retratou formação histórica do sul do Brasil e dilemas humanos. Equilibrou narrativa ampla e psicologia dos personagens.', '1905-12-17', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('b4d68cf2-640e-48cc-9535-51b4e9b6891c', 'Monteiro Lobato', 'Editor e escritor, criador do Sítio do Picapau Amarelo. Defendeu industrialização e educação científica no Brasil. Influenciou a literatura infantil com imaginação e didatismo.', '1882-04-18', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('f683fc6e-e56b-4550-998a-b48cf1438d09', 'Vinicius de Moraes', 'Poeta, diplomata e letrista, parceiro de Tom Jobim na bossa nova. Uniu lirismo amoroso e musicalidade refinada. Sua poesia e canções marcaram a cultura brasileira.', '1913-10-19', 'Brasileiro', NULL);
INSERT INTO public.autor VALUES ('60e46913-fd3f-4f0e-b232-379133057fd8', 'Fernando Pessoa', 'Poeta modernista que criou heterônimos como Álvaro de Campos e Ricardo Reis. Explorou identidade, desassossego e multiplicidade do eu. Figura maior da literatura portuguesa.', '1888-06-13', 'Português', NULL);
INSERT INTO public.autor VALUES ('f49ceed1-00a1-4df1-b970-597af2d23776', 'José Saramago', 'Romancista e Nobel de 1998, autor de “Ensaio sobre a Cegueira”. Estilo de longos períodos e alegorias críticas. Refletiu sobre poder, ética e imaginação histórica.', '1922-11-16', 'Português', NULL);
INSERT INTO public.autor VALUES ('a53e58af-afd1-484f-bea3-7175c5444a03', 'Miguel de Cervantes', 'Autor de “Dom Quixote”, marco do romance moderno. Suas narrativas misturam humor, sátira e reflexão sobre realidade e ficção. Participou da Batalha de Lepanto e viveu períodos difíceis.', '1547-09-29', 'Espanhol', NULL);
INSERT INTO public.autor VALUES ('753593ae-06b2-4021-9d40-cea98e4e46fd', 'Dante Alighieri', 'Poeta medieval autor da “Divina Comédia”. Sua obra sintetiza teologia, filosofia e política em visão épica do além. É pai da língua italiana literária.', '1265-01-01', 'Italiano', NULL);
INSERT INTO public.autor VALUES ('804ec1f4-6c33-4825-9145-1743a8769022', 'Homero', 'Poeta épico a quem se atribuem “Ilíada” e “Odisseia”. Figura sem registros biográficos precisos, possivelmente coletiva. Sua poesia moldou a tradição clássica ocidental.', '0800-01-01 BC', 'Grego', NULL);
INSERT INTO public.autor VALUES ('6a3c4a5d-20f3-4625-b5e3-56c2a346c325', 'Sófocles', 'Dramaturgo trágico da Atenas clássica, autor de “Édipo Rei” e “Antígona”. Aperfeiçoou o coro e a estrutura dramática. Sua visão moral influenciou séculos de teatro.', '0496-01-01 BC', 'Grego', NULL);
INSERT INTO public.autor VALUES ('8b1a96dd-dbc2-4c14-8646-82c0fd580d7c', 'Platão', 'Filósofo discípulo de Sócrates e mestre de Aristóteles. Fundou a Academia e escreveu diálogos que moldaram a metafísica e a política. Ideias sobre formas e conhecimento seguem centrais.', '0428-01-01 BC', 'Grego', NULL);
INSERT INTO public.autor VALUES ('fa696be8-0cd5-4820-baf0-d57d0ac0c760', 'Aristóteles', 'Filósofo enciclopédico, autor de tratados de lógica, ética e poética. Estudou na Academia e fundou o Liceu. Seu método empírico influenciou ciência e pensamento ocidental.', '0384-01-01 BC', 'Grego', NULL);
INSERT INTO public.autor VALUES ('3944af47-2a43-400d-ad9e-cfc109e405c2', 'Friedrich Nietzsche', 'Filósofo crítico da moral tradicional, autor de “Assim Falou Zaratustra”. Introduziu conceitos como vontade de potência e eterno retorno. Estilo aforístico e provocativo marcou a modernidade.', '1844-10-15', 'Alemão', NULL);
INSERT INTO public.autor VALUES ('7c6cd51b-0b2c-4976-b0e8-f04e4d8504f9', 'Jean-Paul Sartre', 'Filósofo e escritor existencialista, autor de “O Ser e o Nada”. Defendeu liberdade, responsabilidade e engajamento político. Recebeu e recusou o Nobel de Literatura de 1964.', '1905-06-21', 'Francês', NULL);
INSERT INTO public.autor VALUES ('24e0cbf6-05c6-41fe-9841-ecbcf196eeff', 'Sun Tzu', 'Estrategista atribuído a “A Arte da Guerra”. Sua autoria e datação são discutidas, mas a obra influenciou séculos de pensamento militar e gestão. Enfatiza conhecimento, adaptação e disciplina.', '0544-01-01 BC', 'Chinês', NULL);
INSERT INTO public.autor VALUES ('ffb107f1-a6af-4a87-8f6c-5285e3b37f44', 'Maquiavel', 'Pensador político renascentista, autor de “O Príncipe”. Analisou poder e realismo na governança com franqueza inédita. Seus escritos marcaram a ciência política moderna.', '1469-05-03', 'Italiano', NULL);
INSERT INTO public.autor VALUES ('37db54e1-1ff9-46d5-84a8-3f6ef5c85cb0', 'Thomas More', 'Humanista e estadista, autor de “Utopia”. Defendeu princípios morais e entrou em choque com Henrique VIII, sendo executado. Canonizado pela Igreja Católica.', '1478-02-07', 'Inglês', NULL);
INSERT INTO public.autor VALUES ('349ff329-58a2-4eb4-8017-6cd633df90b4', 'Oscar Wilde', 'Dramaturgo e romancista de espírito afiado, autor de “O Retrato de Dorian Gray”. Celebrado por humor e crítica social, enfrentou perseguição e prisão. Tornou-se símbolo de liberdade estética.', '1854-10-16', 'Irlandês', NULL);
INSERT INTO public.autor VALUES ('2c2c3fef-a255-46a1-95b2-f3e864edafc1', 'Lewis Carroll', 'Matemático e escritor, criador de “Alice no País das Maravilhas”. Uniu lógica, nonsense e fantasia com inventividade. Sua obra marcou a literatura infantil e a cultura pop.', '1832-01-27', 'Inglês', NULL);
INSERT INTO public.autor VALUES ('171e2e1b-e597-440d-bf31-8686ba8e78b9', 'C.S. Lewis', 'Ensaísta e romancista, autor de “As Crônicas de Nárnia”. Explorou fé, imaginação e moralidade em linguagem acessível. Foi professor em Oxford e Cambridge.', '1898-11-29', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('982e1340-5403-4c13-86e0-53e96f22ed35', 'Roald Dahl', 'Contista e autor infantil, criou “Matilda” e “A Fantástica Fábrica de Chocolate”. Misturou humor, crueldade e ternura em histórias inesquecíveis. Seu estilo direto cativou gerações.', '1916-09-13', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('16560827-a2a3-4b6b-bda1-7be2986e0a37', 'Dr. Seuss', 'Theodor Seuss Geisel, escritor e ilustrador de clássicos infantis rimados. Criou personagens icônicos como o Grinch e o Gato de Chapéu. Estimulou leitura com ritmo e imaginação.', '1904-03-02', 'Americano', NULL);
INSERT INTO public.autor VALUES ('c38f1069-48ef-41ec-860e-78aa7865e6b3', 'Philip K. Dick', 'Autor de ficção científica filosófica, base para filmes como “Blade Runner”. Questionou realidade, identidade e controle em narrativas visionárias. Influenciou cyberpunk e cultura pop.', '1928-12-16', 'Americano', NULL);
INSERT INTO public.autor VALUES ('de443a8c-03bd-418b-9ca6-103741b21ebd', 'Arthur C. Clarke', 'Escritor e divulgador científico, coautor de “2001: Uma Odisseia no Espaço”. Propôs a ideia de satélites geoestacionários para comunicação. Uniu imaginação cósmica e rigor científico.', '1917-12-16', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('2a03fcbc-23bb-4626-8646-f6ff5bb84f44', 'Kurt Vonnegut', 'Romancista satírico, autor de “Matadouro Cinco”. Misturou ficção científica, humor negro e crítica social. Sua prosa direta expõe absurdos da guerra e da burocracia.', '1922-11-11', 'Americano', NULL);
INSERT INTO public.autor VALUES ('fe00af94-7f53-4857-acb8-78b3c69794f0', 'Ray Bradbury', 'Autor de “Fahrenheit 451” e contos líricos de ficção científica. Defendeu bibliotecas e a imaginação como resistência cultural. Escreveu com poesia sobre tecnologia e humanidade.', '1920-08-22', 'Americano', NULL);
INSERT INTO public.autor VALUES ('da5f89e9-5b1a-4816-9945-2c7f554cd559', 'Teste', '', NULL, '', NULL);
INSERT INTO public.autor VALUES ('d7917c16-4c1a-4b54-a735-49f5ff90fc3e', 'Gabriel García Márquez', 'Escritor colombiano, Prêmio Nobel de Literatura 1982', NULL, 'Colombiano', NULL);
INSERT INTO public.autor VALUES ('fd61f678-ea48-4e70-9aa3-930f786e1c2c', 'Douglas Adams', 'Autor de humor e ficção científica, criador de “O Guia do Mochileiro das Galáxias”. Misturou sátira, absurdo e reflexões existenciais. Tornou-se cult na literatura e no rádio.', '1952-03-11', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('e7eed6b5-1b9e-41dd-a8c2-206824a2da68', 'Terry Pratchett', 'Criador do universo Discworld, uniu fantasia, sátira e comentário social. Escreveu dezenas de romances com humor inteligente. Defensor da leitura e das bibliotecas.', '1948-04-28', 'Britânico', NULL);
INSERT INTO public.autor VALUES ('453df1b2-4f71-4ea5-822a-ec2d6c6365cc', 'George R.R. Martin', 'Autor de fantasia épica, criador de “As Crônicas de Gelo e Fogo”. Conhecido por personagens complexos e reviravoltas. Atuou como roteirista e produtor de TV.', '1948-09-20', 'Americano', NULL);
INSERT INTO public.autor VALUES ('bbec8485-794a-469c-9672-953ae1c021c1', 'J.D. Salinger', 'Autor de “O Apanhador no Campo de Centeio”, voz marcante da juventude pós-guerra. Recluso, publicou poucas obras após o sucesso inicial. Sua escrita concisa e sensível influenciou gerações.', '1919-01-01', 'Americano', NULL);
INSERT INTO public.autor VALUES ('538d92ef-5a47-4583-9185-555c18395974', 'Harper Lee', 'Romancista autora de “O Sol é para Todos”, clássico dos direitos civis. Ganhou o Pulitzer e permaneceu discreta ao longo da vida. Sua obra discute justiça, empatia e preconceito.', '1926-04-28', 'Americana', NULL);
INSERT INTO public.autor VALUES ('6c6c4b97-c3e8-4983-bdc2-5f9a0b752f03', 'Sylvia Plath', 'Poeta e romancista, autora de “A Redoma de Vidro”. Sua confessionalidade intensa e imagens poderosas marcaram a poesia moderna. Influenciou movimentos feministas e estudos literários.', '1932-10-27', 'Americana', NULL);
INSERT INTO public.autor VALUES ('6e029f94-a84f-4f41-88ea-c1cabfe1fda1', 'Jack Kerouac', 'Escritor da Geração Beat, autor de “On the Road”. Valorizou espontaneidade, jazz e busca espiritual. Sua prosa impulsiva redefiniu a narrativa de viagem.', '1922-03-12', 'Americano', NULL);
INSERT INTO public.autor VALUES ('4e742b5f-50a8-4279-9ca8-3c27f7fe7e4a', 'Allen Ginsberg', 'Poeta da Geração Beat, autor do manifesto “Uivo”. Defensor de liberdade de expressão e direitos civis. Sua poesia performática uniu mística e crítica social.', '1926-06-03', 'Americano', NULL);
INSERT INTO public.autor VALUES ('3893ba10-b5ad-4d91-8c2f-4009a4f632c3', 'Charles Bukowski', 'Poeta e romancista de linguagem crua, cronista da vida marginal. Escreveu sobre trabalho, álcool e solidão com humor ácido. Tornou-se voz cult do underground literário.', '1920-08-16', 'Americano', NULL);
INSERT INTO public.autor VALUES ('97fbaed2-0764-414f-b4ec-eeb287b22579', 'Truman Capote', 'Autor de “A Sangue Frio”, marco do romance de não ficção. Conhecido pelo estilo elegante e observação psicológica. Transitou entre literatura, jornalismo e sociedade.', '1924-09-30', 'Americano', NULL);
INSERT INTO public.autor VALUES ('0651d094-715a-4322-aa62-1bc9e22c7513', 'Umberto Eco', 'Semiólogo e romancista, autor de “O Nome da Rosa”. Uniu erudição, história e intriga intelectual. Escreveu ensaios influentes sobre mídia e cultura.', '1932-01-05', 'Italiano', NULL);
INSERT INTO public.autor VALUES ('0fa1f2a9-f625-405f-8256-fb7387fbe426', 'Italo Calvino', 'Romancista experimental, autor de “As Cidades Invisíveis”. Explorou leveza, combinatória e imaginação controlada. Sua obra é central no pós-guerra italiano.', '1923-10-15', 'Italiano', NULL);
INSERT INTO public.autor VALUES ('c83a74e4-6f6e-4394-b7dc-6fee57c0e0c1', 'Julio Cortázar', 'Contista e romancista inovador, autor de “O Jogo da Amarelinha”. Brincou com estruturas narrativas e insólito cotidiano. Sua prosa é referência do boom latino-americano.', '1914-08-26', 'Argentino', NULL);
INSERT INTO public.autor VALUES ('8e16d00c-69fc-4225-82c0-b20c217c8fef', 'Jorge Luis Borges', 'Poeta, contista e ensaísta, mestre de labirintos, espelhos e bibliotecas infinitas. Obras como “Ficções” redefiniram o conto filosófico. Diretor da Biblioteca Nacional da Argentina.', '1899-08-24', 'Argentino', NULL);
INSERT INTO public.autor VALUES ('2acbb7ce-0787-40a4-bdc3-bcd9d10ef544', 'Mario Vargas Llosa', 'Romancista e ensaísta, Nobel de 2010. Obras como “A Cidade e os Cachorros” e “Conversa na Catedral” investigam poder e indivíduo. Atuou também na política peruana.', '1936-03-28', 'Peruano', NULL);
INSERT INTO public.autor VALUES ('a65cf8c7-6202-429d-bef4-88833bdb84c6', 'Carlos Ruiz Zafón', 'Autor da saga “O Cemitério dos Livros Esquecidos”. Misturou mistério, romance e metalinguagem em Barcelona do século XX. Tornou-se fenômeno mundial de leitores.', '1964-09-25', 'Espanhol', NULL);
INSERT INTO public.autor VALUES ('f759ce51-e8a5-42e2-aed7-b920bf8f8b3b', 'Stieg Larsson', 'Jornalista e romancista, criador da trilogia Millennium. Abordou corrupção, violência e misoginia na sociedade sueca. Sua série policial ganhou adaptações internacionais.', '1954-08-15', 'Sueco', NULL);
INSERT INTO public.autor VALUES ('400bba49-89a7-47bc-b411-33c52caebed6', 'Dan Brown', 'Autor de best-sellers de suspense tecnológico como “O Código Da Vinci”. Combina arte, religião e criptografia em tramas velozes. Tornou-se figura recorrente nas listas de mais vendidos.', '1964-06-22', 'Americano', NULL);
INSERT INTO public.autor VALUES ('a2fafa54-5845-4181-bfc7-39e50bf0c7c1', 'John Grisham', 'Romancista de thrillers jurídicos, autor de “A Firma” e “Tempo de Matar”. Apresenta bastidores do sistema legal com ritmo e tensão. Publica consistentemente desde os anos 1990.', '1955-02-08', 'Americano', NULL);
INSERT INTO public.autor VALUES ('960f8d5a-6bbf-487b-9a1b-e8bd0f302de7', 'Nicholas Sparks', 'Autor de romances contemporâneos populares como “Diário de uma Paixão”. Suas narrativas exploram amor, perda e reconciliação. Muitas obras viraram filmes.', '1965-12-31', 'Americano', NULL);
INSERT INTO public.autor VALUES ('7adee3dc-84d8-48a5-8088-55e3a4c5b425', 'E L James', 'Autora da trilogia “Cinquenta Tons de Cinza”. Tornou-se fenômeno editorial global com romances eróticos. Seu trabalho provocou debates sobre gênero e mercado editorial.', '1963-03-07', 'Britânica', NULL);
INSERT INTO public.autor VALUES ('8634aa74-e216-44d0-81ac-23075b972744', 'Suzanne Collins', 'Criadora de “Jogos Vorazes”, referência da distopia jovem. Aborda mídia, poder e resistência em sociedade autoritária. Roteirista com carreira prévia na TV infantil.', '1962-08-10', 'Americana', NULL);
INSERT INTO public.autor VALUES ('048d43fd-03fb-48ae-8413-4ab3cfeef8ef', 'Veronica Roth', 'Autora da trilogia “Divergente”. Escreve ficção jovem com foco em identidade e escolhas morais. Viu suas obras adaptadas para o cinema.', '1988-08-19', 'Americana', NULL);
INSERT INTO public.autor VALUES ('f54bbef3-280b-43f4-b04e-32ca9b487f79', 'Rick Riordan', 'Autor da série “Percy Jackson e os Olimpianos”. Renovou o interesse em mitologia para jovens leitores. Também criou sagas baseadas em tradições egípcias e nórdicas.', '1964-06-05', 'Americano', NULL);
INSERT INTO public.autor VALUES ('727f7270-2877-48ee-a012-1501e042fdeb', 'Fiódor Dostoiévski', 'Grande romancista russo, autor de Crime e Castigo', NULL, 'Russo', NULL);


--
-- TOC entry 5389 (class 0 OID 42883)
-- Dependencies: 251
-- Data for Name: avaliacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.avaliacoes VALUES (1, 'a31c7792-3463-414b-9b30-d79777d64250', '00000000-0000-0000-0000-000000000003', 5, 'Livro excelente! Recomendo muito!', '2025-11-17 21:23:13.405134');
INSERT INTO public.avaliacoes VALUES (2, 'a31c7792-3463-414b-9b30-d79777d64250', '00000000-0000-0000-0000-000000000002', 5, 'Uma obra-prima da literatura!', '2025-11-17 21:23:50.044562');
INSERT INTO public.avaliacoes VALUES (3, '0607a558-ce31-4975-b885-0d4c306dcfb5', '00000000-0000-0000-0000-000000000002', 5, 'Uma obra-prima da literatura!', '2025-11-17 21:23:50.066994');
INSERT INTO public.avaliacoes VALUES (4, 'b632063a-4b48-492a-a926-8df0cef98e58', '00000000-0000-0000-0000-000000000002', 4, 'Uma obra-prima da literatura!', '2025-11-17 21:23:50.073448');
INSERT INTO public.avaliacoes VALUES (5, '4defb9c5-e36f-4402-8d24-9c6cb81e517d', '00000000-0000-0000-0000-000000000002', 4, 'O livro é bom mas o autor pecou nos detalhes acho que poderia ser mais assustador', '2025-11-18 21:34:33.193775');


--
-- TOC entry 5391 (class 0 OID 50991)
-- Dependencies: 253
-- Data for Name: avaliacoes_autor; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.avaliacoes_autor VALUES (1, '0f72ad62-d53c-46ab-99ee-477e3834ebcb', '00000000-0000-0000-0000-000000000003', 5, 'George Orwell é um mestre em criar distopias que nos fazem refletir sobre o poder e a liberdade. Sua escrita direta e impactante denuncia autoritarismos de forma atemporal. 1984 e A Revolução dos Bichos são leituras essenciais!', '2025-11-09 20:23:06.255356');
INSERT INTO public.avaliacoes_autor VALUES (2, '0f72ad62-d53c-46ab-99ee-477e3834ebcb', '00000000-0000-0000-0000-000000000004', 5, 'Relendo Orwell em 2025 e suas obras continuam extremamente relevantes. A vigilância digital, fake news e manipulação da verdade que ele previu estão mais atuais do que nunca. Um autor visionário!', '2025-11-09 20:23:06.279118');
INSERT INTO public.avaliacoes_autor VALUES (3, '2be4da4b-25bd-4796-ace3-58a11ce3bf3c', '00000000-0000-0000-0000-000000000003', 5, 'Asimov revolucionou a ficção científica com suas Leis da Robótica e a série Fundação. Sua capacidade de misturar ciência, filosofia e narrativa envolvente é única. Um verdadeiro visionário!', '2025-10-26 20:23:06.28149');
INSERT INTO public.avaliacoes_autor VALUES (4, 'f85b2a0a-e979-4ac9-b3d9-cb768c175c7b', '00000000-0000-0000-0000-000000000003', 5, 'Machado de Assis é simplesmente o maior escritor brasileiro. Sua ironia, narrativas não-confiáveis e análise da sociedade são incomparáveis. Dom Casmurro e Memórias Póstumas mudaram minha forma de ler literatura.', '2025-11-14 20:23:06.287303');
INSERT INTO public.avaliacoes_autor VALUES (5, 'f85b2a0a-e979-4ac9-b3d9-cb768c175c7b', '00000000-0000-0000-0000-000000000004', 5, 'A profundidade psicológica dos personagens de Machado é impressionante. Cada releitura revela novas camadas de significado. Um gênio absoluto da literatura mundial!', '2025-11-15 20:23:06.29112');
INSERT INTO public.avaliacoes_autor VALUES (6, '850eade9-c5df-4b33-a766-4856111af7a4', '00000000-0000-0000-0000-000000000003', 4, 'José de Alencar é fundamental para entender o Romantismo brasileiro. Iracema e Senhora são obras lindas que constroem mitos nacionais. A linguagem é poética, embora às vezes datada para leitores modernos.', '2025-11-09 20:23:06.293585');
INSERT INTO public.avaliacoes_autor VALUES (7, '66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000003', 4, 'Aluísio Azevedo retrata o Rio de Janeiro do século XIX com realismo impressionante. O Cortiço é uma obra-prima do Naturalismo, mostrando as duras condições sociais da época. Leitura importante para entender a história brasileira.', '2025-11-17 20:23:06.296286');
INSERT INTO public.avaliacoes_autor VALUES (8, 'a9c2ff15-c5dd-4a65-a777-d223dd434e45', '00000000-0000-0000-0000-000000000003', 4, 'Anne Frank é um autor excepcional cujas obras trazem reflexões importantes sobre a condição humana. Sua escrita é envolvente e suas histórias ficam marcadas na memória do leitor.', '2025-11-17 20:23:06.298308');
INSERT INTO public.avaliacoes_autor VALUES (9, '41792d29-c3b2-44f5-9f97-d6288232d0a1', '00000000-0000-0000-0000-000000000003', 4, 'Bram Stoker é um autor excepcional cujas obras trazem reflexões importantes sobre a condição humana. Sua escrita é envolvente e suas histórias ficam marcadas na memória do leitor.', '2025-10-31 20:23:06.301921');
INSERT INTO public.avaliacoes_autor VALUES (10, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000003', 4, 'Mary Shelley é um autor excepcional cujas obras trazem reflexões importantes sobre a condição humana. Sua escrita é envolvente e suas histórias ficam marcadas na memória do leitor.', '2025-10-20 20:23:06.30381');
INSERT INTO public.avaliacoes_autor VALUES (11, '5a452ae0-54fa-4a46-81ec-fbdd550f307b', '00000000-0000-0000-0000-000000000003', 4, 'William Shakespeare é um autor excepcional cujas obras trazem reflexões importantes sobre a condição humana. Sua escrita é envolvente e suas histórias ficam marcadas na memória do leitor.', '2025-11-06 20:23:06.307463');
INSERT INTO public.avaliacoes_autor VALUES (12, '8fda8c42-c2f8-4174-b35c-897087a77fef', '00000000-0000-0000-0000-000000000003', 4, 'Agatha Christie é um autor excepcional cujas obras trazem reflexões importantes sobre a condição humana. Sua escrita é envolvente e suas histórias ficam marcadas na memória do leitor.', '2025-11-04 20:23:06.310768');


--
-- TOC entry 5361 (class 0 OID 25276)
-- Dependencies: 220
-- Data for Name: categoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categoria VALUES ('08f4e834-8b59-486f-8750-d6d1121f7bfd', 'Fantasia', NULL);
INSERT INTO public.categoria VALUES ('5ae955a5-1124-424e-9de9-0af41067aaca', 'Distopia', NULL);
INSERT INTO public.categoria VALUES ('0555b73c-8fd8-48cd-8eb8-87b4a1681eee', 'Ficção Científica', NULL);
INSERT INTO public.categoria VALUES ('9e87f49d-d00b-4c56-8bb8-df4fadb25820', 'teste', NULL);
INSERT INTO public.categoria VALUES ('63eedfe1-61c5-4fc9-b3ad-84b2a5721fe6', 'Ficção Política', NULL);
INSERT INTO public.categoria VALUES ('51b27445-2f1a-4a7e-98d7-72c39ba86953', 'Fábula', NULL);
INSERT INTO public.categoria VALUES ('9b893aee-fb30-4a85-a635-956933dd309a', 'Romance', 'Histórias centradas em relacionamentos amorosos.');
INSERT INTO public.categoria VALUES ('b4ddc7d0-aa91-490e-9f05-ddc0cac6f94a', 'Suspense / Thriller', 'Narrativas com alta tensão, perigo e reviravoltas.');
INSERT INTO public.categoria VALUES ('ca812306-30db-4097-884d-7bbe90816df9', 'Mistério / Policial', 'Enigmas, investigações e a solução de crimes.');
INSERT INTO public.categoria VALUES ('fbc0cf0d-72ef-44a2-8eb7-5ca7cbbf36c3', 'Terror / Horror', 'Histórias que provocam medo, podem envolver o sobrenatural.');
INSERT INTO public.categoria VALUES ('764f8adc-da60-4fd3-9e30-f963845e7d63', 'Aventura', 'Jornadas, exploração, ação e desafios em lugares exóticos.');
INSERT INTO public.categoria VALUES ('95321168-9136-469b-a10a-dfe96c90703f', 'História', 'Obras não-ficcionais sobre eventos e períodos passados.');
INSERT INTO public.categoria VALUES ('71439130-75ee-490e-baf1-997913add4c0', 'Biografia / Autobiografia', 'Relatos sobre a vida de pessoas reais.');
INSERT INTO public.categoria VALUES ('59be6021-1034-45bf-b02f-3082bcf1f126', 'Autoajuda / Desenvolvimento Pessoal', 'Guias para crescimento pessoal e bem-estar.');
INSERT INTO public.categoria VALUES ('f2515c8c-8942-42b7-bb1e-afbc8deaf6f1', 'Infantil / Infantojuvenil', 'Livros destinados a crianças e jovens leitores.');
INSERT INTO public.categoria VALUES ('8f40d6db-20cb-4916-8731-af1c5baa2c3a', 'Técnico / Computação / Ciência', 'Conteúdo educativo sobre áreas específicas do conhecimento.');
INSERT INTO public.categoria VALUES ('e1eb9dfc-e28f-4835-85ce-ea10812e24e4', 'Poesia', 'Expressão artística através de versos e poemas.');
INSERT INTO public.categoria VALUES ('c5a37e27-f893-495b-a0d5-7953cbf35a95', 'Contos', 'Coletâneas de histórias curtas.');
INSERT INTO public.categoria VALUES ('cc7cf809-dce5-4e2b-ba98-d8fd714b3311', 'Drama', 'Narrativas focadas em conflitos emocionais e relações humanas.');
INSERT INTO public.categoria VALUES ('11be1759-94a4-4eb4-8aa6-20558f40f58f', 'Humor', 'Livros cômicos, satíricos ou divertidos.');
INSERT INTO public.categoria VALUES ('5dafe14d-7095-4ac7-ab5b-61ad87104883', 'Clássicos', 'Obras literárias reconhecidas por seu valor histórico e artístico.');
INSERT INTO public.categoria VALUES ('c27cb93e-9153-4051-8bd7-9428c56df843', 'Literatura Clássica', 'Clássicos da literatura mundial');
INSERT INTO public.categoria VALUES ('35e0683a-5df0-4223-8071-490905ba6c70', 'Literatura Brasileira', 'Obras da literatura brasileira');
INSERT INTO public.categoria VALUES ('eebde766-3084-402a-9ed1-2c28f4c4786f', 'Terror', 'Livros de terror e suspense');
INSERT INTO public.categoria VALUES ('b50b33d4-e84c-4383-956b-4d331f33e6e1', 'Mistério', 'Livros de mistério e detetive');
INSERT INTO public.categoria VALUES ('45691547-b3d8-4b1e-9b61-3fa0fbf72546', 'Realismo Mágico', 'Obras que misturam realidade com elementos fantásticos');
INSERT INTO public.categoria VALUES ('5da7b726-2025-4e2c-a9db-a26acf602e9e', 'Filosofia', 'Obras filosóficas e de pensamento');
INSERT INTO public.categoria VALUES ('95b1821f-5fa9-4ccd-a317-54e2c5b4073b', 'Biografia', 'Biografias e autobiografias');
INSERT INTO public.categoria VALUES ('c3ca37ab-9a94-4c07-9f42-df09ec033482', 'Autoajuda', 'Livros de desenvolvimento pessoal');


--
-- TOC entry 5393 (class 0 OID 51018)
-- Dependencies: 255
-- Data for Name: curtidas_comentario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.curtidas_comentario VALUES (1, 'autor', 1, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.266998');
INSERT INTO public.curtidas_comentario VALUES (2, 'autor', 1, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.273476');
INSERT INTO public.curtidas_comentario VALUES (3, 'autor', 2, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.280386');
INSERT INTO public.curtidas_comentario VALUES (4, 'autor', 3, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.282833');
INSERT INTO public.curtidas_comentario VALUES (5, 'autor', 3, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.283865');
INSERT INTO public.curtidas_comentario VALUES (6, 'autor', 3, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.284892');
INSERT INTO public.curtidas_comentario VALUES (7, 'autor', 3, '00000000-0000-0000-0000-000000000002', '2025-11-18 20:23:06.285735');
INSERT INTO public.curtidas_comentario VALUES (8, 'autor', 4, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.288339');
INSERT INTO public.curtidas_comentario VALUES (9, 'autor', 4, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.289059');
INSERT INTO public.curtidas_comentario VALUES (10, 'autor', 4, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.289738');
INSERT INTO public.curtidas_comentario VALUES (11, 'autor', 5, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.292529');
INSERT INTO public.curtidas_comentario VALUES (12, 'autor', 6, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.294768');
INSERT INTO public.curtidas_comentario VALUES (13, 'autor', 7, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.297128');
INSERT INTO public.curtidas_comentario VALUES (14, 'autor', 7, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.297734');
INSERT INTO public.curtidas_comentario VALUES (15, 'autor', 8, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.299666');
INSERT INTO public.curtidas_comentario VALUES (16, 'autor', 8, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.300684');
INSERT INTO public.curtidas_comentario VALUES (17, 'autor', 8, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.301359');
INSERT INTO public.curtidas_comentario VALUES (18, 'autor', 9, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.302651');
INSERT INTO public.curtidas_comentario VALUES (19, 'autor', 10, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.30495');
INSERT INTO public.curtidas_comentario VALUES (20, 'autor', 10, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.305977');
INSERT INTO public.curtidas_comentario VALUES (21, 'autor', 10, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.306753');
INSERT INTO public.curtidas_comentario VALUES (22, 'autor', 11, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.308247');
INSERT INTO public.curtidas_comentario VALUES (23, 'autor', 11, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.308954');
INSERT INTO public.curtidas_comentario VALUES (24, 'autor', 11, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.309584');
INSERT INTO public.curtidas_comentario VALUES (25, 'autor', 11, '00000000-0000-0000-0000-000000000002', '2025-11-18 20:23:06.310136');
INSERT INTO public.curtidas_comentario VALUES (26, 'autor', 12, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.311476');
INSERT INTO public.curtidas_comentario VALUES (27, 'autor', 12, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.312143');
INSERT INTO public.curtidas_comentario VALUES (28, 'autor', 12, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.313097');
INSERT INTO public.curtidas_comentario VALUES (29, 'livro', 1, '00000000-0000-0000-0000-000000000003', '2025-11-18 20:23:06.317948');
INSERT INTO public.curtidas_comentario VALUES (30, 'livro', 2, '00000000-0000-0000-0000-000000000003', '2025-11-18 20:23:06.320314');
INSERT INTO public.curtidas_comentario VALUES (31, 'livro', 2, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.321105');
INSERT INTO public.curtidas_comentario VALUES (32, 'livro', 2, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.32176');
INSERT INTO public.curtidas_comentario VALUES (33, 'livro', 2, '00000000-0000-0000-0000-000000000006', '2025-11-18 20:23:06.322445');
INSERT INTO public.curtidas_comentario VALUES (34, 'livro', 2, '00000000-0000-0000-0000-000000000002', '2025-11-18 20:23:06.32402');
INSERT INTO public.curtidas_comentario VALUES (35, 'livro', 3, '00000000-0000-0000-0000-000000000003', '2025-11-18 20:23:06.324579');
INSERT INTO public.curtidas_comentario VALUES (36, 'livro', 3, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.325327');
INSERT INTO public.curtidas_comentario VALUES (37, 'livro', 3, '00000000-0000-0000-0000-000000000005', '2025-11-18 20:23:06.32597');
INSERT INTO public.curtidas_comentario VALUES (38, 'livro', 4, '00000000-0000-0000-0000-000000000003', '2025-11-18 20:23:06.326802');
INSERT INTO public.curtidas_comentario VALUES (39, 'livro', 4, '00000000-0000-0000-0000-000000000004', '2025-11-18 20:23:06.327698');


--
-- TOC entry 5373 (class 0 OID 42554)
-- Dependencies: 232
-- Data for Name: dominios_permitidos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5364 (class 0 OID 25313)
-- Dependencies: 223
-- Data for Name: emprestimo; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.emprestimo VALUES ('5b6d4d4e-a619-4f49-8d21-a488f07b832c', '2025-06-25', '2025-06-28', NULL, 'ativa', '00000000-0000-0000-0000-000000000007', 'a31c7792-3463-414b-9b30-d79777d64250', 'reserva', '2025-06-25 19:53:45.344677-03', '2025-06-28', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('718618cf-5815-4c51-9c0f-ee0ded61b1e3', '2025-06-25', '2025-06-28', NULL, 'ativa', '00000000-0000-0000-0000-000000000004', '4d020990-d63a-4603-a54c-8bc608bca417', 'reserva', '2025-06-25 19:53:45.344677-03', '2025-06-28', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('7bad6a9f-7274-4e18-9275-d802fd3985a2', '2025-11-14', '2025-11-19', NULL, 'disponivel', '00000000-0000-0000-0000-000000000002', '61240bdc-306e-47d4-8b85-5e0b36bc5531', 'reserva', '2025-11-14 21:45:10.592983-03', '2025-11-19', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('12293987-484b-4a7a-8dcd-b4909083da96', '2025-11-15', '2025-11-23', NULL, 'aguardando', '00000000-0000-0000-0000-000000000002', 'b632063a-4b48-492a-a926-8df0cef98e58', 'reserva', '2025-11-15 21:45:10.602551-03', '2025-11-23', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('ede46e8f-4502-4b3d-bd2c-0f622e2a9aff', '2025-11-06', '2025-11-13', NULL, 'concluido', '00000000-0000-0000-0000-000000000002', '0607a558-ce31-4975-b885-0d4c306dcfb5', 'reserva', '2025-11-06 21:45:10.604505-03', '2025-11-13', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('b75cd4c5-42d4-4de9-9115-de566ddd9e0c', '2025-11-01', '2025-11-08', NULL, 'expirado', '00000000-0000-0000-0000-000000000002', '2567c9c4-629b-4293-8d10-59dbe6a57aa5', 'reserva', '2025-11-01 21:45:10.606484-03', '2025-11-08', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('87061d03-44e3-41fc-9206-e50e52166556', '2025-11-11', '2025-11-18', NULL, 'cancelado', '00000000-0000-0000-0000-000000000002', '2122fcb8-041a-424f-8201-12292261b312', 'reserva', '2025-11-11 21:45:10.608306-03', '2025-11-18', NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('4133915c-7968-4710-b574-a526c1e46e05', '2025-06-25', '2025-07-09', NULL, 'ativo', '00000000-0000-0000-0000-000000000003', 'c38e2d91-b9ff-4b28-a7b4-9d9890c474f0', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('b216c9f0-4a2b-436c-9c19-1467c282a1c7', '2025-05-10', '2025-05-24', '2025-05-22', 'devolvido', '00000000-0000-0000-0000-000000000004', 'cf09e794-7068-4f77-a40e-20e47c8f2015', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('c38216ac-dbb8-45ec-bfcf-c427e3f520ce', '2024-01-10', '2024-01-24', '2024-01-23', 'devolvido', '00000000-0000-0000-0000-000000000003', 'de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('c6d79963-c163-45f7-9207-ad87e4012a2f', '2024-02-15', '2024-02-29', '2024-02-28', 'devolvido', '00000000-0000-0000-0000-000000000004', 'de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('4064548f-cf53-4a1b-970f-d288880a5df2', '2024-03-05', '2024-03-19', '2024-03-18', 'devolvido', '00000000-0000-0000-0000-000000000005', 'de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('b54f7011-49fa-4fcb-9069-2cd4dc69be76', '2024-04-20', '2024-05-04', '2024-05-02', 'devolvido', '00000000-0000-0000-0000-000000000006', 'de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('661fe697-9348-4262-86b4-d1c8b8d8e917', '2024-05-01', '2024-05-15', '2024-05-15', 'devolvido', '00000000-0000-0000-0000-000000000007', '1cf0c81e-4a45-4e95-9f39-262b218d101e', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('a941254e-5091-4457-9111-90da6fe1573a', '2024-06-01', '2024-06-15', '2024-06-14', 'devolvido', '00000000-0000-0000-0000-000000000002', '6c230999-be58-4ed8-b3e4-e1c2f4ca17df', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('d30b9ef0-0397-4283-883c-03c192a04930', '2024-07-11', '2024-07-25', '2024-07-25', 'devolvido', '00000000-0000-0000-0000-000000000003', 'bbf25362-4ab7-4354-8ce4-681daf4fa844', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('a0ccf907-3108-4ef3-8661-86cd724217c9', '2023-02-25', '2023-03-11', '2023-03-07', 'devolvido', '00000000-0000-0000-0000-000000000005', 'bbf25362-4ab7-4354-8ce4-681daf4fa844', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('f93939d8-5d6b-41be-8632-ea90df13a4b1', '2023-03-22', '2023-04-05', '2023-04-01', 'devolvido', '00000000-0000-0000-0000-000000000005', '2122fcb8-041a-424f-8201-12292261b312', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('bfaa03b0-be56-4ae7-93c2-09a2acc8c7f4', '2023-04-20', '2023-05-04', '2023-05-04', 'devolvido', '00000000-0000-0000-0000-000000000005', '61240bdc-306e-47d4-8b85-5e0b36bc5531', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('090a6685-cad2-4086-88bb-ff73f4f9ef3a', '2023-05-22', '2023-06-05', '2023-06-02', 'devolvido', '00000000-0000-0000-0000-000000000005', '2cb63c63-7f42-4429-8194-228c4ea56764', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('9e19251e-6f9c-4f30-8ac2-1c9909790633', '2023-07-01', '2023-07-15', '2023-07-15', 'devolvido', '00000000-0000-0000-0000-000000000005', 'a31c7792-3463-414b-9b30-d79777d64250', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('bd7bcba6-07e5-4d18-a069-0816a8a6481d', '2023-07-27', '2023-08-10', '2023-08-07', 'devolvido', '00000000-0000-0000-0000-000000000005', '4d020990-d63a-4603-a54c-8bc608bca417', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('ac125574-c568-4d3d-bf6d-771064e6a56b', '2023-09-06', '2023-09-20', '2023-09-17', 'devolvido', '00000000-0000-0000-0000-000000000005', 'de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('2d87f5e6-b764-40ae-9e71-5089c96648d4', '2023-10-06', '2023-10-20', '2023-10-18', 'devolvido', '00000000-0000-0000-0000-000000000003', '187be390-949a-4799-8edb-93a49c5f05e4', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('946c9a1c-41e6-49ad-a9a8-48545aabee7b', '2023-11-02', '2023-11-16', '2023-11-14', 'devolvido', '00000000-0000-0000-0000-000000000003', 'c38e2d91-b9ff-4b28-a7b4-9d9890c474f0', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('11c5cfa0-5bae-44a1-8806-31e61e3dab76', '2023-11-27', '2023-12-11', '2023-12-07', 'devolvido', '00000000-0000-0000-0000-000000000003', '0f4a9300-7f61-4ec5-963d-9f7fa1c5e03c', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('dcb88914-071f-4267-a31a-0036931f5d0c', '2023-12-15', '2023-12-29', '2023-12-26', 'devolvido', '00000000-0000-0000-0000-000000000003', 'd1bd2185-0e27-427e-aecb-0f87e592c6c6', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('62ba1a0f-dbad-4579-9c4a-1d9a8b0f3a4f', '2024-01-12', '2024-01-26', '2024-01-23', 'devolvido', '00000000-0000-0000-0000-000000000003', '1cf0c81e-4a45-4e95-9f39-262b218d101e', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('7a15db3a-79cc-4c77-bf1a-fe2fd54bb275', '2024-02-17', '2024-03-02', '2024-03-02', 'devolvido', '00000000-0000-0000-0000-000000000006', 'b632063a-4b48-492a-a926-8df0cef98e58', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('3b990b45-ab68-4a45-a2e2-0cf466dc822c', '2024-03-17', '2024-03-31', '2024-03-30', 'devolvido', '00000000-0000-0000-0000-000000000006', '4ee2f79a-5a7b-4c42-ab19-891617066af6', 'emprestimo', NULL, NULL, NULL, NULL, false);
INSERT INTO public.emprestimo VALUES ('a57c6109-7c9d-4836-b882-32860b2fde63', '2024-04-20', '2024-05-04', '2024-04-30', 'devolvido', '00000000-0000-0000-0000-000000000006', '2567c9c4-629b-4293-8d10-59dbe6a57aa5', 'emprestimo', NULL, NULL, NULL, NULL, false);


--
-- TOC entry 5403 (class 0 OID 51166)
-- Dependencies: 268
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5371 (class 0 OID 42515)
-- Dependencies: 230
-- Data for Name: item_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5362 (class 0 OID 25286)
-- Dependencies: 221
-- Data for Name: livro; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.livro VALUES ('4bf623f7-e475-49e1-b43e-b44c5226811c', 'As Aventuras de Sherlock Holmes', NULL, NULL, NULL, NULL, NULL, '2026-05-01 16:14:44.200468-03', 0, 0.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('5b3b6907-4db6-49ad-b9dd-b9d8d4afde97', 'Ao Farol', '978-8520923597', 1927, 256, 'A família Ramsay e suas visitas à ilha de Skye', 'https://m.media-amazon.com/images/I/81-rYedlzVL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 4, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('a31c7792-3463-414b-9b30-d79777d64250', '1984', '9780451524935', 1949, 328, 'Uma poderosa crítica aos regimes totalitários, acompanhando a vida de Winston Smith em um mundo controlado pelo Grande Irmão.', 'https://www3.unicentro.br/petfisica/wp-content/uploads/sites/54/2015/07/1984-e1660882586968.jpg', '2025-06-23 01:42:05.544702-03', 0, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('0607a558-ce31-4975-b885-0d4c306dcfb5', 'O Pequeno Príncipe', '9788572329795', 1943, 96, 'Um piloto perdido no deserto encontra um príncipe vindo de outro planeta, refletindo sobre o amor e a essência da vida.', 'https://upload.wikimedia.org/wikipedia/pt/4/47/O-pequeno-pr%C3%ADncipe.jpg', '2025-06-23 01:46:42.431064-03', 0, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('b632063a-4b48-492a-a926-8df0cef98e58', 'O Alquimista', '9788575422391', 1988, 192, 'Santiago, um jovem pastor, viaja em busca de um tesouro e descobre seu destino.', 'https://m.media-amazon.com/images/I/71-ifOPuOGL._UF1000,1000_QL80_.jpg', '2025-06-24 23:42:49.791622-03', 5, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('9476c42a-5846-4068-abc3-20aeb0a58304', 'A Menina que Roubava Livros', '9788579800249', 2005, 480, 'Narrado pela Morte, o livro acompanha a vida de Liesel Meminger na Alemanha nazista.', 'https://br.web.img3.acsta.net/pictures/210/537/21053777_20131029202242322.jpg', '2025-06-24 23:42:24.385955-03', 5, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('4defb9c5-e36f-4402-8d24-9c6cb81e517d', 'Frankenstein', '9788535908661', 1818, 280, 'Victor Frankenstein cria uma criatura em um experimento científico que foge ao controle.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqbFIS8EvcsqqX8OQmHwlheJpuhTd_UJ-I8g&s', '2025-06-24 23:42:07.48914-03', 2, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('bbf25362-4ab7-4354-8ce4-681daf4fa844', 'Orgulho e Preconceito', '9788551002324', 1813, 352, 'Elizabeth Bennet lida com questões de classe, casamento e moral na Inglaterra georgiana.', 'https://m.media-amazon.com/images/I/719esIW3D7L._UF1000,1000_QL80_.jpg', '2025-06-24 23:41:41.027461-03', 3, 2.50, NULL, false, 2);
INSERT INTO public.livro VALUES ('2cb63c63-7f42-4429-8194-228c4ea56764', 'O Diário de Anne Frank', '9788572329402', 1947, 240, 'Relato emocionante da vida de uma jovem judia escondida durante a Segunda Guerra.', 'https://m.media-amazon.com/images/I/91RMqWB-CTL._UF1000,1000_QL80_.jpg', '2025-06-24 23:41:12.081077-03', 7, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'O Pequeno Príncipe', '9788595080802', 1943, 96, 'Uma fábula poética sobre amor, amizade e perda, contada por um pequeno príncipe que viaja de planeta em planeta.', 'https://br.web.img3.acsta.net/pictures/15/06/25/16/20/518080.jpg', '2025-06-24 23:34:16.844173-03', 5, 2.50, NULL, false, 5);
INSERT INTO public.livro VALUES ('1f7a69cd-9186-453e-bb0f-12a8812eabb8', 'A Revolução dos Bichos', '978-0451526342', 1945, 112, 'Animais expulsam fazendeiro e criam sociedade igualitária. Porcos assumem poder e se tornam tão tiranos quanto humanos.', 'https://aveceditora.com.br/wp-content/uploads/2025/02/capa.jpg', '2025-11-25 22:21:42.532657-03', 8, 2.80, 2.00, true, 0);
INSERT INTO public.livro VALUES ('3a87fcb0-38a4-458d-9544-46cb118d01ac', 'Harry Potter e a Pedra Filosofal', '978-8532530787', 1997, 264, 'Harry descobre que é um bruxo e inicia sua jornada em Hogwarts', 'https://imgv2-1-f.scribdassets.com/img/word_document/763645125/original/216x287/665b39df63/1763397627?v=1', '2025-11-25 23:11:23.390374-03', 10, 4.50, 3.50, true, 0);
INSERT INTO public.livro VALUES ('4955f646-d1cb-4bcb-b865-fc5706c0bad1', 'Harry Potter e a Câmara Secreta', '978-8532530794', 1998, 288, 'Harry retorna a Hogwarts e enfrenta novos mistérios', 'https://m.media-amazon.com/images/I/71NsVQ5MlwL.jpg', '2025-11-25 23:11:23.390374-03', 8, 4.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('2aed9d44-03e7-4f97-a5fa-56ab8d2a1de9', 'Harry Potter e o Prisioneiro de Azkaban', '978-8532530800', 1999, 352, 'Sirius Black escapa e Harry descobre segredos sobre seu passado', 'https://br.web.img2.acsta.net/medias/nmedia/18/93/88/04/20282944.jpg', '2025-11-25 23:11:23.390374-03', 7, 5.00, 4.00, true, 0);
INSERT INTO public.livro VALUES ('be7ac722-726a-4984-8685-c2036229fb0b', 'O Hobbit', '978-8595084742', 1937, 336, 'Bilbo Bolseiro parte em uma aventura inesperada', 'https://m.media-amazon.com/images/I/91M9xPIf10L.jpg', '2025-11-25 23:11:23.390374-03', 12, 4.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('1173a0fa-a437-412e-8cdd-9e3d61a40062', 'O Senhor dos Anéis: A Sociedade do Anel', '978-8595084766', 1954, 576, 'Frodo inicia a jornada para destruir o Um Anel', 'https://m.media-amazon.com/images/S/pv-target-images/57c834bb94c8fb81db3408daaf5e21e115bc64ffc597ddc6a6eb6c3bbc798caf.jpg', '2025-11-25 23:11:23.390374-03', 6, 6.00, 5.00, true, 0);
INSERT INTO public.livro VALUES ('8c088fbc-a7ce-4045-bf1e-341554cf6d6c', 'As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', '978-8578277109', 1950, 208, 'Quatro irmãos descobrem um mundo mágico através de um guarda-roupa', 'https://m.media-amazon.com/images/I/7158aW38zxL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 9, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('4f4ae889-11d1-4f4d-be0d-9da83b3b7658', 'A História Sem Fim', '978-8533613447', 1979, 432, 'Bastian se perde em um livro mágico que muda sua vida', 'https://m.media-amazon.com/images/I/711LoT1vN1L._AC_UF350,350_QL50_.jpg', '2025-11-25 23:11:23.390374-03', 5, 4.50, 3.50, true, 0);
INSERT INTO public.livro VALUES ('4ee2f79a-5a7b-4c42-ab19-891617066af6', 'O Morro dos Ventos Uivantes', '9788583861716', 1847, 400, 'História intensa de amor e vingança entre Heathcliff e Catherine Earnshaw.', 'https://m.media-amazon.com/images/I/71lqmkoeosL._AC_UF1000,1000_QL80_.jpg', '2025-06-24 23:44:04.902278-03', 3, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('72de0ec1-5a3f-4d88-b07c-c3092438fc4a', 'Morte no Nilo', '978-8595081581', 1937, 352, 'Poirot investiga um assassinato durante um cruzeiro', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXBlepm_TLBUtwcXVmk4wTsxdH6o1Kbey_sh2RL2U04U6DukDoW3393qC-Dg7q0ehH6IUczNIXGjni3zqywZ5RbZNMTJGDCgWBTdldOAI&s=10', '2025-11-25 23:11:23.390374-03', 7, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('4d020990-d63a-4603-a54c-8bc608bca417', 'O Silêncio dos Inocentes', '9788577990676', 1988, 376, 'Clarice Starling busca ajuda do Dr. Hannibal Lecter para capturar um serial killer.', 'https://m.media-amazon.com/images/I/91ETm9i7AAL.jpg', '2025-06-24 23:43:27.793455-03', 4, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('5c2d0664-e81e-46dd-846f-2d3d8eec48e9', 'Alice no País das Maravilhas', '978-8544001066', 1865, 128, 'Alice cai em uma toca de coelho e vive aventuras surreais', 'https://grupoautentica.f1cdn.com.br/view/false/false/true/false/208.jpg?MjA4LQ==', '2025-11-25 23:11:23.390374-03', 8, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('61240bdc-306e-47d4-8b85-5e0b36bc5531', 'A Garota no Trem', '9788580577269', 2015, 378, 'Rachel presencia algo suspeito de um trem e acaba envolvida em um mistério.', 'https://books.google.com.br/books/publisher/content?id=rt1ECgAAQBAJ&hl=pt-BR&pg=PP1&img=1&zoom=3&bul=1&sig=ACfU3U3hiqG-pORII2vuBMGMpX752kmsTQ&w=1280', '2025-06-24 23:43:05.702287-03', 3, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('187be390-949a-4799-8edb-93a49c5f05e4', 'Senhora', '9788508104666', 1875, 208, 'Aurélia Camargo transforma-se em uma mulher poderosa após herdar uma fortuna.', 'https://m.media-amazon.com/images/I/711tJRe6LML.jpg', '2025-06-24 23:51:50.266851-03', 3, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('bc5f53ff-8786-4546-9b0a-68442ecd9f63', 'Peter Pan', '978-8594318602', 1911, 184, 'O menino que nunca cresce e suas aventuras na Terra do Nunca', 'https://m.media-amazon.com/images/I/81GGqzDlwoL.jpg', '2025-11-25 23:11:23.390374-03', 7, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('660b70a6-05e7-4df1-8dc7-b01cf7cc9108', 'O Pequeno Príncipe', '978-8522008865', 1943, 96, 'Um príncipe de outro planeta ensina sobre amor e amizade', 'https://harpercollins.com.br/cdn/shop/files/9786559800469.jpg?v=1721832896', '2025-11-25 23:11:23.390374-03', 15, 2.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('505c95e3-8c4f-44a0-884d-09c4fcc22cae', '1984', '978-0451524935', 1949, 328, 'Uma distopia sombria onde Big Brother observa tudo. Winston Smith luta contra a tirania totalitária que controla até os pensamentos.', 'https://m.media-amazon.com/images/I/71rpa1-kyvL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 22:21:42.532657-03', 5, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('a716f293-27bd-40e7-a366-840814b9a576', 'Dom Casmurro', '978-8535911664', 1899, 256, 'Bentinho narra sua vida e o tormento do ciúme de Capitu. Será que ela o traiu com Escobar?', 'https://m.media-amazon.com/images/I/71c7p6HZ3IL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 22:21:42.532657-03', 7, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('c6a0ebd1-c7dd-42f2-82fa-cfb484f5dce6', 'Iracema', '978-8508040407', 1865, 96, 'Lenda do Ceará: o amor impossível entre a índia Iracema e o português Martim.', 'https://m.media-amazon.com/images/I/81X1rRRt9hL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 22:21:42.532657-03', 4, 2.00, 1.50, true, 0);
INSERT INTO public.livro VALUES ('0f4a9300-7f61-4ec5-963d-9f7fa1c5e03c', 'Capitães da Areia', '9788520932055', 1937, 280, 'Romance de Jorge Amado que retrata a vida de menores abandonados nas ruas de Salvador.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLC0NSoxIcJXvwAT2S71LOGUtGD2qEYmJfqQ&s', '2025-06-24 23:34:16.844173-03', 2, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('2122fcb8-041a-424f-8201-12292261b312', 'O Cortiço', '9788520922483', 1890, 208, 'Análise crítica das transformações sociais no Rio de Janeiro do século XIX.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpSlQCuK8msHthejBOEDvGue8QDiDkWGworA&s', '2025-06-24 23:38:05.855651-03', 2, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('6c230999-be58-4ed8-b3e4-e1c2f4ca17df', 'O Hobbit', '9788595084756', 1937, 336, 'A aventura de Bilbo Bolseiro pelo mundo da Terra Média em busca de um tesouro guardado por um dragão.', 'https://m.media-amazon.com/images/I/81arD48HpRL._UF1000,1000_QL80_.jpg', '2025-06-24 23:38:20.514239-03', 6, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('d1bd2185-0e27-427e-aecb-0f87e592c6c6', 'A Máquina do Tempo', '9788520923077', 1895, 160, 'Um cientista viaja milhares de anos no futuro e testemunha o destino da humanidade.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIhgJNIBGB9JE6R57CHz-mO-YhIZHJQnTnfQ&s', '2025-06-24 23:48:35.751997-03', 3, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('cf09e794-7068-4f77-a40e-20e47c8f2015', 'A Metamorfose', '9788535914846', 1915, 104, 'Gregor Samsa acorda certo dia transformado em um inseto monstruoso, enfrentando o desprezo de sua família.', 'https://m.media-amazon.com/images/I/8115Gj1cb6L._UF894,1000_QL80_.jpg', '2025-06-24 23:37:48.398751-03', 3, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('1cf0c81e-4a45-4e95-9f39-262b218d101e', 'A Revolução dos Bichos', '9788535909552', 1945, 152, 'Uma sátira ao stalinismo, em que animais tomam o controle de uma fazenda e estabelecem sua própria tirania.', 'https://m.media-amazon.com/images/I/91BsZhxCRjL._UF1000,1000_QL80_.jpg', '2025-06-24 23:34:16.844173-03', 3, 2.50, NULL, false, 2);
INSERT INTO public.livro VALUES ('2567c9c4-629b-4293-8d10-59dbe6a57aa5', 'Drácula', '9788580447807', 1897, 416, 'O clássico romance gótico sobre o conde Drácula e sua tentativa de se mudar para a Inglaterra.', 'https://m.media-amazon.com/images/I/61MgodE1s0L._UF1000,1000_QL80_.jpg', '2025-06-24 23:41:54.387319-03', 4, 2.50, NULL, false, 1);
INSERT INTO public.livro VALUES ('c38e2d91-b9ff-4b28-a7b4-9d9890c474f0', 'Dom Casmurro', '9788533302065', 1899, 256, 'A obra de Machado de Assis narra a história de Bentinho e Capitu, com dúvidas e ambiguidades sobre amor e traição.', 'https://m.media-amazon.com/images/I/61Z2bMhGicL.jpg', '2025-06-24 23:34:16.844173-03', 4, 2.50, NULL, false, 2);
INSERT INTO public.livro VALUES ('08a2d735-af93-4c10-b9cb-1d447693461c', 'Crime e Castigo', '978-8535911152', 1866, 560, 'Raskólnikov comete um assassinato e lida com a culpa', 'https://m.magazineluiza.com.br/a-static/420x420/livro-crime-e-castigo/selectalivros/7851p/15e3e6948a023dc3bc4420c5b998f206.jpg', '2025-11-25 23:11:23.390374-03', 8, 5.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('133f01ba-8544-4eea-8566-6b0518b72f4c', 'Oliver Twist', '978-8544001950', 1838, 544, 'Um órfão enfrenta a dura realidade da Londres vitoriana', 'https://m.media-amazon.com/images/I/71toChnX05L._SL1335_.jpg', '2025-11-25 23:11:23.390374-03', 7, 4.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('03bb0469-5c1d-43bb-9c63-69f80bb87054', 'Razão e Sensibilidade', '978-8544001974', 1811, 416, 'As irmãs Dashwood e suas diferentes visões do amor', 'https://m.media-amazon.com/images/I/71quFHXaMlL._SY466_.jpg', '2025-11-25 23:11:23.390374-03', 5, 3.50, 3.00, true, 0);
INSERT INTO public.livro VALUES ('12e97a86-0c4f-436d-86aa-15f66095d846', 'Emma', '978-8544002001', 1815, 512, 'Emma Woodhouse e suas tentativas de casamenteira', 'https://m.media-amazon.com/images/I/81IL27N1LVL._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 6, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('6665fd61-077c-45a2-88b4-36a476b5823d', 'Orgulho e Preconceito', '978-8544001943', 1813, 424, 'Elizabeth Bennet e Mr. Darcy em um romance clássico', 'https://m.media-amazon.com/images/I/81gOkEhzgIL._UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 10, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('e6e00540-e5e4-433c-97b8-df6cbefe3cd9', 'O Amor nos Tempos do Cólera', '978-8501058980', 1985, 464, 'Uma história de amor que atravessa décadas', 'https://m.media-amazon.com/images/I/71GjyZVAYEL.jpg', '2025-11-25 23:11:23.390374-03', 7, 4.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('4f11b089-b0e8-4db0-bd41-3d79b297af3b', 'Fundação', '978-8576570646', 1951, 244, 'Hari Seldon prevê a queda do Império Galáctico usando psicohistória. Cria duas Fundações para preservar o conhecimento.', 'https://m.media-amazon.com/images/I/712vJIziMgL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 22:21:42.532657-03', 3, 4.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('95454817-b37e-4235-89a8-8f8810809eb0', 'Um Estudo em Vermelho', '978-8544001011', 1887, 176, 'A primeira aventura de Sherlock Holmes e Dr. Watson investigando assassinatos misteriosos em Londres.', 'https://cdl-static.s3-sa-east-1.amazonaws.com/covers/gg/9788537810873/um-estudo-em-vermelho-edicao-bolso-de-luxo.jpg', '2025-11-25 22:21:42.532657-03', 6, 3.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('24fbb426-2715-414b-852c-8038423fde52', 'Os Irmãos Karamázov', '978-8535911176', 1880, 944, 'Três irmãos e o assassinato de seu pai', 'https://m.media-amazon.com/images/I/81C2Ijb3bVL._SL1297_.jpg', '2025-11-25 23:11:23.390374-03', 5, 7.00, 6.00, true, 0);
INSERT INTO public.livro VALUES ('f6df2574-7e84-4903-b267-704eae36511d', 'Grandes Esperanças', '978-8544001967', 1861, 544, 'Pip e sua jornada de pobre órfão a cavalheiro', 'https://m.media-amazon.com/images/I/81sgTJvW7KL._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 6, 4.00, 3.00, true, 0);
INSERT INTO public.livro VALUES ('ae89b8cd-c733-4fa0-875c-734d3fec017c', 'Cem Anos de Solidão', '978-8501012371', 1967, 424, 'A saga da família Buendía em Macondo', 'https://m.media-amazon.com/images/I/816Yy5v+S5L._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 8, 5.00, 4.00, true, 0);
INSERT INTO public.livro VALUES ('51255f07-da9f-4fef-8e71-874075f5f0cc', 'O Iluminado', '978-8581050126', 1977, 464, 'Jack Torrance aceita ser zelador de um hotel isolado nas montanhas', 'https://m.media-amazon.com/images/I/81Q+pJi4NjL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 6, 5.00, 4.00, true, 0);
INSERT INTO public.livro VALUES ('77325789-8448-4deb-8576-8858bf211cfe', 'It: A Coisa', '978-8560280247', 1986, 1104, 'Uma entidade maligna aterroriza a cidade de Derry', 'https://m.media-amazon.com/images/I/91g9Dvtf+jL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 4, 7.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('dab9a17a-088b-4fe8-a999-91326702a901', 'Carrie: A Estranha', '978-8581052922', 1974, 288, 'Uma garota com poderes telecinéticos se vinga de seus agressores', 'https://cdl-static.s3-sa-east-1.amazonaws.com/covers/gg/9788556511348/carrie.jpg', '2025-11-25 23:11:23.390374-03', 5, 4.00, 3.00, true, 0);
INSERT INTO public.livro VALUES ('88f074d8-8dd9-472a-9f09-a378d0de7b44', 'O Cemitério', '978-8581052939', 1983, 416, 'Um cemitério misterioso que traz os mortos de volta', 'https://m.media-amazon.com/images/I/8151ymQnnuL.jpg', '2025-11-25 23:11:23.390374-03', 6, 4.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('59dabf65-25e4-4c8d-99ef-75fbe26b8ec0', 'Drácula', '978-8544001929', 1897, 488, 'O clássico sobre o vampiro mais famoso de todos os tempos', 'https://m.media-amazon.com/images/I/81mDS7CO2YL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 8, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('c5c1c8c1-6edf-4599-8d3d-fdd1a3254d08', 'Frankenstein', '978-8544002032', 1818, 280, 'Victor Frankenstein cria uma criatura que foge de seu controle', 'https://darkside.vtexassets.com/arquivos/ids/168084/94-frankenstein-ou-o-prometeu-moderno.jpg?v=636802548559600000', '2025-11-25 23:11:23.390374-03', 7, 3.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('6fe665c8-fadb-48bb-8165-cf0e55176739', 'O Médico e o Monstro', '978-8544001998', 1886, 144, 'Dr. Jekyll cria uma poção que libera seu lado obscuro', 'https://www.moderna.com.br/data/files/DA/20/08/83/2D50E510A92A20E528A808A8/omedicoeomonstro_md.jpg', '2025-11-25 23:11:23.390374-03', 6, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('55a21a6a-d5cf-425a-b23d-0fca95b121fa', 'O Exorcista', '978-8580572766', 1971, 385, 'Uma menina é possuída por uma entidade demoníaca', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROBUo_wn_GfkAGS6QphZXiMP-6u-UPiAu6kVqhCOCUST_fqlwWEnelKbTjPcrzAeXKvl_G9S4Yno1TEYlea8SU405a308vLBqSuG6XLQ&s=10', '2025-11-25 23:11:23.390374-03', 5, 4.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('c778e0ae-0307-44aa-a6b6-ed7a2cc25cb9', 'Entrevista com o Vampiro', '978-8532525918', 1976, 416, 'Louis conta sua história como vampiro a um repórter', 'https://m.media-amazon.com/images/I/71uPPT8QB2L.jpg', '2025-11-25 23:11:23.390374-03', 6, 4.50, 3.50, true, 0);
INSERT INTO public.livro VALUES ('d8b1b4e9-9654-4fc3-b5b7-b282687c4f5a', 'A Assombração da Casa da Colina', '978-8580573893', 1959, 256, 'Quatro pessoas investigam fenômenos sobrenaturais', 'https://m.media-amazon.com/images/I/81T8UStK1XS._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 4, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('54d87f09-8b4b-4282-a002-40bee2d5d415', 'Assassinato no Expresso do Oriente', '978-8595081574', 1934, 256, 'Hercule Poirot investiga um assassinato em um trem', 'https://m.media-amazon.com/images/I/81Zp6MFxIDL.jpg', '2025-11-25 23:11:23.390374-03', 8, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('ec871895-f1f1-4bbe-88f5-7469a69618c5', 'O Caso dos Dez Negrinhos', '978-8595081598', 1939, 272, 'Dez pessoas são convidadas para uma ilha e começam a morrer', 'https://m.media-amazon.com/images/I/41Z7JLCp57L._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 9, 3.50, 3.00, true, 0);
INSERT INTO public.livro VALUES ('dffd4d0e-ff72-4211-8ab6-e1f69812047d', 'O Cão dos Baskervilles', '978-8544001134', 1902, 256, 'Sherlock Holmes investiga uma maldição familiar', 'https://m.media-amazon.com/images/I/619kzsBXy8L.jpg', '2025-11-25 23:11:23.390374-03', 10, 3.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('8e0fe1a4-77e5-46f2-a1fa-a972dd1e3f3a', 'O Sinal dos Quatro', '978-8544001141', 1890, 176, 'Watson e Holmes investigam um mistério envolvendo tesouros', 'https://cdl-static.s3-sa-east-1.amazonaws.com/covers/gg/9788537814635/o-signo-dos-quatro-edicao-bolso-de-luxo.jpg', '2025-11-25 23:11:23.390374-03', 8, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('9a288131-21d8-4503-9e72-1511a678bd02', 'O Nome da Rosa', '978-8577992638', 1980, 544, 'Monge franciscano investiga mortes misteriosas em um mosteiro', 'https://m.media-amazon.com/images/I/81uo8phJ+zL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 6, 5.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('f14a0378-7a99-4566-b780-476a17a51cfa', 'O Código Da Vinci', '978-8599296639', 2003, 432, 'Robert Langdon investiga um assassinato no Louvre', 'https://m.media-amazon.com/images/I/71marwX+lyL._UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 12, 5.00, 4.00, true, 0);
INSERT INTO public.livro VALUES ('8cfc5cca-c700-4ed3-831f-ff283449a2c4', 'Anjos e Demônios', '978-8599296646', 2000, 512, 'Langdon enfrenta uma conspiração contra o Vaticano', 'https://m.media-amazon.com/images/I/81SlD07DNZL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 10, 5.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('65b839a4-c8a8-4dc7-ad44-e6ac497760ff', 'A Menina que Roubava Livros', '978-8598078175', 2005, 480, 'Durante a Segunda Guerra, uma menina encontra consolo nos livros', 'https://m.media-amazon.com/images/I/61L+4OBhm-L._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 9, 4.50, 3.50, true, 0);
INSERT INTO public.livro VALUES ('cbfd341e-457a-4c22-8de4-1fb43fb3a86e', 'O Silêncio dos Inocentes', '978-8580570410', 1988, 368, 'Agente do FBI busca ajuda de serial killer para capturar outro', 'https://m.media-amazon.com/images/I/91ETm9i7AAL.jpg', '2025-11-25 23:11:23.390374-03', 7, 4.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('10a9d52a-edc8-4a28-aac1-ead0ef5d2eba', 'Anna Kariênina', '978-8535911183', 1877, 864, 'O affair de Anna e suas trágicas consequências', 'https://cdl-static.s3-sa-east-1.amazonaws.com/covers/gg/9788535929225/anna-karienina.jpg', '2025-11-25 23:11:23.390374-03', 6, 6.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('b7eedfba-522a-4005-a941-4380958b96d5', 'Mrs. Dalloway', '978-8520923580', 1925, 224, 'Um dia na vida de Clarissa Dalloway em Londres', 'https://m.media-amazon.com/images/I/6156oqHGUKL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 5, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('ce89499b-dfed-4b9d-a7a1-92e570dd82a2', 'Memórias de Emília', '978-8525052674', 1936, 192, 'Emília conta suas aventuras', 'https://m.media-amazon.com/images/I/81rRKkS8-sL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 10, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('07ba23bb-391b-4a2f-a0be-0536b75d0942', 'A Chave do Tamanho', '978-8525052667', 1942, 160, 'Emília diminui todos os seres humanos', 'https://m.media-amazon.com/images/I/61JAGVLhajL.jpg', '2025-11-25 23:11:23.390374-03', 9, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('859a596d-ad71-4c6a-bc8f-882e5ee7884b', 'O Saci', '978-8525052650', 1921, 176, 'A história do Saci-Pererê', 'https://www.historiadetudo.com/wp-content/uploads/2021/06/saci-monteiro-lobato.png', '2025-11-25 23:11:23.390374-03', 11, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('1a38b1c7-81ee-4169-8402-52d5116a1751', 'Caçadas de Pedrinho', '978-8525052643', 1933, 144, 'Pedrinho caça uma onça no sítio', 'https://m.media-amazon.com/images/I/811UXXdfQnL._SY425_.jpg', '2025-11-25 23:11:23.390374-03', 10, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('a23a88c8-03fa-434c-a818-47fde2b2d4c2', 'Reinações de Narizinho', '978-8525052636', 1931, 288, 'Aventuras de Narizinho no Sítio do Picapau Amarelo', 'https://m.media-amazon.com/images/I/919o26MYuJL._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 12, 3.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('65e70a0a-c030-404b-8f11-cc4682c54523', 'A Rosa do Povo', '978-8535911701', 1945, 176, 'Poesia social e engajada de Drummond', 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQQpjeD7Stu6P8WZg02nejOxw7TUrOSbesP0krBXZYmr5bwYfvb7sfLrL033wrDAQJc5EcSUpBCeoOUEwJOATP70b7qas5rpWQSURrAOU07Q7ZYa7M9TdVU&usqp=CAc', '2025-11-25 23:11:23.390374-03', 7, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('a2c789e8-45b8-42c3-a59d-4ec526b8981c', 'Claro Enigma', '978-8535911718', 1951, 144, 'Reflexões sobre a existência e o tempo', 'https://static.wixstatic.com/media/d073e0_627e0f22095b4befa066d8f92bbd0a45~mv2.jpg/v1/fit/w_340,h_487,al_c,q_80/d073e0_627e0f22095b4befa066d8f92bbd0a45~mv2.jpg', '2025-11-25 23:11:23.390374-03', 6, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('d6b4c849-d996-47fe-aae1-3bad565967e2', 'Sentimento do Mundo', '978-8535911695', 1940, 128, 'Poemas que refletem sobre o mundo e a condição humana', 'https://m.media-amazon.com/images/I/81Th3PuyYSL.jpg', '2025-11-25 23:11:23.390374-03', 8, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('a800eaa2-0c16-45ec-a423-6fa8546c9f54', 'Viagem', '978-8526012110', 1939, 192, 'Coletânea de poemas de Cecília Meireles', 'https://d1o6h00a1h5k7q.cloudfront.net/imagens/img_m/46375/22674339_1.jpg', '2025-11-25 23:11:23.390374-03', 6, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('b25fa70d-6f15-4444-b372-437c8c253722', 'Romanceiro da Inconfidência', '978-8526012103', 1953, 328, 'Poemas sobre a Inconfidência Mineira', 'https://m.media-amazon.com/images/I/91vffAXVicL._UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 5, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('e20c2384-9944-4ceb-997b-6d048442ab9a', 'O Tempo e o Vento', '978-8535908961', 1949, 688, 'A saga da família Terra Cambará no Rio Grande do Sul', 'https://midias-publicas.enciclopedia.itaucultural.org.br/g9b941zieziz5xw8xn4k442xbw1b', '2025-11-25 23:11:23.390374-03', 6, 6.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('2b2805ca-9f70-4e24-8d19-5a3d956fe24b', 'O Quinze', '978-8503012211', 1930, 144, 'A seca de 1915 no Ceará e suas consequências', 'https://m.media-amazon.com/images/I/61g43KcOIzL._SL1096_.jpg', '2025-11-25 23:11:23.390374-03', 8, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('c526f18b-0249-463b-ada2-092be4f64da5', 'Vidas Secas', '978-8501012364', 1938, 176, 'Família de retirantes foge da seca nordestina', 'https://m.media-amazon.com/images/I/71NYL2AbBIL._SY466_.jpg', '2025-11-25 23:11:23.390374-03', 12, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('3b854212-1900-4161-8d64-4c2016cd3734', 'São Bernardo', '978-8501012357', 1934, 192, 'Paulo Honório e sua busca obsessiva por sucesso', 'https://m.magazineluiza.com.br/a-static/420x420/s-bernardo-editora-antofagica/webplus/70791p/592388008af64262b599bf0d4665a70c.jpeg', '2025-11-25 23:11:23.390374-03', 7, 2.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('34a80fdd-3835-4f7f-9bee-8805b12f8aed', 'Capitães da Areia', '978-8535909005', 1937, 280, 'Meninos de rua em Salvador enfrentam a sociedade', 'https://m.media-amazon.com/images/I/816CKGW3kXL._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 9, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('476bfc48-f0ed-4d7d-a9a6-d047e43662bf', 'Gabriela, Cravo e Canela', '978-8535908992', 1958, 424, 'Nacib e Gabriela na Ilhéus dos anos 1920', 'https://m.media-amazon.com/images/I/71Q6dMq8EkL._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 8, 4.50, 3.50, true, 0);
INSERT INTO public.livro VALUES ('d387ec68-7fe1-44e0-b8eb-2f3801380771', 'A Paixão Segundo G.H.', '978-8520925676', 1964, 176, 'Uma dona de casa vive uma experiência existencial', 'https://m.media-amazon.com/images/I/71ikTpqg2PL.jpg', '2025-11-25 23:11:23.390374-03', 6, 3.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('cb3c4ade-c293-443e-a6cb-8bea8b68cd85', 'A Hora da Estrela', '978-8520925683', 1977, 88, 'Macabéa, uma nordestina no Rio de Janeiro', 'https://images.dlivros.org/Clarice-Lispector/hora-estrela-clarice-lispector_large.webp', '2025-11-25 23:11:23.390374-03', 10, 2.50, 2.00, true, 0);
INSERT INTO public.livro VALUES ('d8557e14-a776-4e80-9210-00367b67d3db', 'Brida', '978-8595080157', 1990, 256, 'Uma jovem irlandesa busca conhecimento mágico', 'https://m.media-amazon.com/images/I/81RUvNPFCVL._UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 8, 3.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('5cea5e32-fc3e-418f-a65c-5cb9fced700f', 'O Alquimista', '978-8595080140', 1988, 256, 'Santiago busca seu tesouro no deserto do Egito', 'https://m.media-amazon.com/images/I/61FU5KPhTFL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 15, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('d3634e56-11c6-424c-83c5-6abd801ef1d4', 'Em Busca do Tempo Perdido', '978-8525406491', 1913, 528, 'Memórias e reflexões sobre o tempo e a memória', 'https://m.media-amazon.com/images/I/91tsgH5VJJL._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 5, 6.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('e74c42a8-6f4a-4309-90cc-40f34da739a7', 'Ulisses', '978-8544001325', 1922, 832, 'Um dia na vida de Leopold Bloom em Dublin', 'https://m.media-amazon.com/images/I/71GSEDzL-JL._AC_UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 4, 7.00, 6.00, true, 0);
INSERT INTO public.livro VALUES ('42fdf44f-e9e2-413b-bc97-38fb79d37e4c', 'O Castelo', '978-8535908794', 1926, 480, 'K. tenta alcançar as autoridades de um castelo misterioso', 'https://m.media-amazon.com/images/I/61WX99gNZ2L._SL1201_.jpg', '2025-11-25 23:11:23.390374-03', 6, 4.50, NULL, false, 0);
INSERT INTO public.livro VALUES ('c09968f4-f72c-40a5-8c7b-c8121540c978', 'O Processo', '978-8535908787', 1925, 320, 'Josef K. é acusado de um crime que desconhece', 'https://m.media-amazon.com/images/I/61W5uzV6MLL._SL1360_.jpg', '2025-11-25 23:11:23.390374-03', 7, 3.50, 2.50, true, 0);
INSERT INTO public.livro VALUES ('6e03c6e6-4bb9-4da8-9cb8-55253e43d2d7', 'A Metamorfose', '978-8535908770', 1915, 96, 'Gregor Samsa acorda transformado em um inseto', 'https://m.media-amazon.com/images/I/8115Gj1cb6L._UF1000,1000_QL80_.jpg', '2025-11-25 23:11:23.390374-03', 10, 2.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('e5a7e30c-b43e-48b6-b847-f331ed864496', 'O Sol Também Se Levanta', '978-8528608205', 1926, 272, 'Expatriados americanos em Paris e Pamplona', 'https://m.media-amazon.com/images/I/81HLIHXj06L._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 5, 3.50, 3.00, true, 0);
INSERT INTO public.livro VALUES ('9f38eea2-8182-4c51-827a-2e24378ee27e', 'Por Quem os Sinos Dobram', '978-8528608199', 1940, 512, 'Robert Jordan e a Guerra Civil Espanhola', 'https://www.360meridianos.com/wp-content/uploads/2017/04/livro-por-quem-os-sinos-dobram.jpg.webp', '2025-11-25 23:11:23.390374-03', 6, 5.00, NULL, false, 0);
INSERT INTO public.livro VALUES ('0ac8e3cd-ff29-48bf-aece-869e0a46227d', 'O Velho e o Mar', '978-8528613452', 1952, 128, 'Um velho pescador luta com um grande peixe', 'https://m.media-amazon.com/images/I/71wo6d7Ex3L._SL1500_.jpg', '2025-11-25 23:11:23.390374-03', 8, 2.50, 2.00, true, 0);


--
-- TOC entry 5366 (class 0 OID 25349)
-- Dependencies: 225
-- Data for Name: livro_autor; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.livro_autor VALUES ('61240bdc-306e-47d4-8b85-5e0b36bc5531', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
INSERT INTO public.livro_autor VALUES ('a31c7792-3463-414b-9b30-d79777d64250', '0f72ad62-d53c-46ab-99ee-477e3834ebcb');
INSERT INTO public.livro_autor VALUES ('de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', '22222222-2222-2222-2222-222222222222');
INSERT INTO public.livro_autor VALUES ('c38e2d91-b9ff-4b28-a7b4-9d9890c474f0', '33333333-3333-3333-3333-333333333333');
INSERT INTO public.livro_autor VALUES ('cf09e794-7068-4f77-a40e-20e47c8f2015', '55555555-5555-5555-5555-555555555555');
INSERT INTO public.livro_autor VALUES ('6c230999-be58-4ed8-b3e4-e1c2f4ca17df', '77777777-7777-7777-7777-777777777777');
INSERT INTO public.livro_autor VALUES ('1cf0c81e-4a45-4e95-9f39-262b218d101e', '0f72ad62-d53c-46ab-99ee-477e3834ebcb');
INSERT INTO public.livro_autor VALUES ('0f4a9300-7f61-4ec5-963d-9f7fa1c5e03c', '44444444-4444-4444-4444-444444444444');
INSERT INTO public.livro_autor VALUES ('b632063a-4b48-492a-a926-8df0cef98e58', '56eee620-0414-4432-b8bb-6e298c94f7ac');
INSERT INTO public.livro_autor VALUES ('9476c42a-5846-4068-abc3-20aeb0a58304', '88888888-8888-8888-8888-888888888888');
INSERT INTO public.livro_autor VALUES ('4defb9c5-e36f-4402-8d24-9c6cb81e517d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
INSERT INTO public.livro_autor VALUES ('2567c9c4-629b-4293-8d10-59dbe6a57aa5', '41792d29-c3b2-44f5-9f97-d6288232d0a1');
INSERT INTO public.livro_autor VALUES ('bbf25362-4ab7-4354-8ce4-681daf4fa844', '99999999-9999-9999-9999-999999999999');
INSERT INTO public.livro_autor VALUES ('2cb63c63-7f42-4429-8194-228c4ea56764', 'a9c2ff15-c5dd-4a65-a777-d223dd434e45');
INSERT INTO public.livro_autor VALUES ('2122fcb8-041a-424f-8201-12292261b312', '66666666-6666-6666-6666-666666666666');
INSERT INTO public.livro_autor VALUES ('4ee2f79a-5a7b-4c42-ab19-891617066af6', '282719cf-b134-44a8-a529-f338eee2acbb');
INSERT INTO public.livro_autor VALUES ('4d020990-d63a-4603-a54c-8bc608bca417', '61a8f93f-8d60-4866-8ea1-728266f98e62');
INSERT INTO public.livro_autor VALUES ('187be390-949a-4799-8edb-93a49c5f05e4', '850eade9-c5df-4b33-a766-4856111af7a4');
INSERT INTO public.livro_autor VALUES ('505c95e3-8c4f-44a0-884d-09c4fcc22cae', '0f72ad62-d53c-46ab-99ee-477e3834ebcb');
INSERT INTO public.livro_autor VALUES ('4f11b089-b0e8-4db0-bd41-3d79b297af3b', '2be4da4b-25bd-4796-ace3-58a11ce3bf3c');
INSERT INTO public.livro_autor VALUES ('a716f293-27bd-40e7-a366-840814b9a576', '33333333-3333-3333-3333-333333333333');
INSERT INTO public.livro_autor VALUES ('c6a0ebd1-c7dd-42f2-82fa-cfb484f5dce6', '850eade9-c5df-4b33-a766-4856111af7a4');
INSERT INTO public.livro_autor VALUES ('95454817-b37e-4235-89a8-8f8810809eb0', '0f1b5f93-b796-4f52-b163-aa07d0f78444');
INSERT INTO public.livro_autor VALUES ('1f7a69cd-9186-453e-bb0f-12a8812eabb8', '0f72ad62-d53c-46ab-99ee-477e3834ebcb');
INSERT INTO public.livro_autor VALUES ('3a87fcb0-38a4-458d-9544-46cb118d01ac', '532fe53f-e1c2-490c-80bc-3cad716d5638');
INSERT INTO public.livro_autor VALUES ('4955f646-d1cb-4bcb-b865-fc5706c0bad1', '532fe53f-e1c2-490c-80bc-3cad716d5638');
INSERT INTO public.livro_autor VALUES ('2aed9d44-03e7-4f97-a5fa-56ab8d2a1de9', '532fe53f-e1c2-490c-80bc-3cad716d5638');
INSERT INTO public.livro_autor VALUES ('51255f07-da9f-4fef-8e71-874075f5f0cc', '5db90aae-70aa-4265-9cf2-1b96eafd7028');
INSERT INTO public.livro_autor VALUES ('77325789-8448-4deb-8576-8858bf211cfe', '5db90aae-70aa-4265-9cf2-1b96eafd7028');
INSERT INTO public.livro_autor VALUES ('dab9a17a-088b-4fe8-a999-91326702a901', '5db90aae-70aa-4265-9cf2-1b96eafd7028');
INSERT INTO public.livro_autor VALUES ('88f074d8-8dd9-472a-9f09-a378d0de7b44', '5db90aae-70aa-4265-9cf2-1b96eafd7028');
INSERT INTO public.livro_autor VALUES ('54d87f09-8b4b-4282-a002-40bee2d5d415', '8fda8c42-c2f8-4174-b35c-897087a77fef');
INSERT INTO public.livro_autor VALUES ('72de0ec1-5a3f-4d88-b07c-c3092438fc4a', '8fda8c42-c2f8-4174-b35c-897087a77fef');
INSERT INTO public.livro_autor VALUES ('ec871895-f1f1-4bbe-88f5-7469a69618c5', '8fda8c42-c2f8-4174-b35c-897087a77fef');
INSERT INTO public.livro_autor VALUES ('dffd4d0e-ff72-4211-8ab6-e1f69812047d', '0f1b5f93-b796-4f52-b163-aa07d0f78444');
INSERT INTO public.livro_autor VALUES ('8e0fe1a4-77e5-46f2-a1fa-a972dd1e3f3a', '0f1b5f93-b796-4f52-b163-aa07d0f78444');
INSERT INTO public.livro_autor VALUES ('ae89b8cd-c733-4fa0-875c-734d3fec017c', 'd7917c16-4c1a-4b54-a735-49f5ff90fc3e');
INSERT INTO public.livro_autor VALUES ('e6e00540-e5e4-433c-97b8-df6cbefe3cd9', 'd7917c16-4c1a-4b54-a735-49f5ff90fc3e');
INSERT INTO public.livro_autor VALUES ('6665fd61-077c-45a2-88b4-36a476b5823d', '99999999-9999-9999-9999-999999999999');
INSERT INTO public.livro_autor VALUES ('12e97a86-0c4f-436d-86aa-15f66095d846', '99999999-9999-9999-9999-999999999999');
INSERT INTO public.livro_autor VALUES ('03bb0469-5c1d-43bb-9c63-69f80bb87054', '99999999-9999-9999-9999-999999999999');
INSERT INTO public.livro_autor VALUES ('133f01ba-8544-4eea-8566-6b0518b72f4c', '5fb08353-7a0b-4925-b91a-e320b2ce7409');
INSERT INTO public.livro_autor VALUES ('f6df2574-7e84-4903-b267-704eae36511d', '5fb08353-7a0b-4925-b91a-e320b2ce7409');
INSERT INTO public.livro_autor VALUES ('08a2d735-af93-4c10-b9cb-1d447693461c', '727f7270-2877-48ee-a012-1501e042fdeb');
INSERT INTO public.livro_autor VALUES ('24fbb426-2715-414b-852c-8038423fde52', '727f7270-2877-48ee-a012-1501e042fdeb');
INSERT INTO public.livro_autor VALUES ('b7eedfba-522a-4005-a941-4380958b96d5', '89756b61-cc97-4022-addc-d247abce5f3d');
INSERT INTO public.livro_autor VALUES ('5b3b6907-4db6-49ad-b9dd-b9d8d4afde97', '89756b61-cc97-4022-addc-d247abce5f3d');
INSERT INTO public.livro_autor VALUES ('0ac8e3cd-ff29-48bf-aece-869e0a46227d', 'd6d1057b-2b9a-428a-a1c5-02f8c913a74f');
INSERT INTO public.livro_autor VALUES ('9f38eea2-8182-4c51-827a-2e24378ee27e', 'd6d1057b-2b9a-428a-a1c5-02f8c913a74f');
INSERT INTO public.livro_autor VALUES ('e5a7e30c-b43e-48b6-b847-f331ed864496', 'd6d1057b-2b9a-428a-a1c5-02f8c913a74f');
INSERT INTO public.livro_autor VALUES ('6e03c6e6-4bb9-4da8-9cb8-55253e43d2d7', '55555555-5555-5555-5555-555555555555');
INSERT INTO public.livro_autor VALUES ('c09968f4-f72c-40a5-8c7b-c8121540c978', '55555555-5555-5555-5555-555555555555');
INSERT INTO public.livro_autor VALUES ('42fdf44f-e9e2-413b-bc97-38fb79d37e4c', '55555555-5555-5555-5555-555555555555');
INSERT INTO public.livro_autor VALUES ('be7ac722-726a-4984-8685-c2036229fb0b', '77777777-7777-7777-7777-777777777777');
INSERT INTO public.livro_autor VALUES ('1173a0fa-a437-412e-8cdd-9e3d61a40062', '77777777-7777-7777-7777-777777777777');
INSERT INTO public.livro_autor VALUES ('5cea5e32-fc3e-418f-a65c-5cb9fced700f', '56eee620-0414-4432-b8bb-6e298c94f7ac');
INSERT INTO public.livro_autor VALUES ('d8557e14-a776-4e80-9210-00367b67d3db', '56eee620-0414-4432-b8bb-6e298c94f7ac');
INSERT INTO public.livro_autor VALUES ('cb3c4ade-c293-443e-a6cb-8bea8b68cd85', 'da7faa5b-5aee-4925-b3ef-41fed615f5f0');
INSERT INTO public.livro_autor VALUES ('d387ec68-7fe1-44e0-b8eb-2f3801380771', 'da7faa5b-5aee-4925-b3ef-41fed615f5f0');
INSERT INTO public.livro_autor VALUES ('476bfc48-f0ed-4d7d-a9a6-d047e43662bf', '44444444-4444-4444-4444-444444444444');
INSERT INTO public.livro_autor VALUES ('34a80fdd-3835-4f7f-9bee-8805b12f8aed', '44444444-4444-4444-4444-444444444444');
INSERT INTO public.livro_autor VALUES ('c526f18b-0249-463b-ada2-092be4f64da5', '11648b5d-c056-4305-bbdd-906ea3d58c09');
INSERT INTO public.livro_autor VALUES ('3b854212-1900-4161-8d64-4c2016cd3734', '11648b5d-c056-4305-bbdd-906ea3d58c09');
INSERT INTO public.livro_autor VALUES ('2b2805ca-9f70-4e24-8d19-5a3d956fe24b', 'eb936366-7768-460a-a5c9-13a78db3da88');
INSERT INTO public.livro_autor VALUES ('e20c2384-9944-4ceb-997b-6d048442ab9a', '2f266d16-6020-44bb-aedb-041d8e38f3b4');
INSERT INTO public.livro_autor VALUES ('b25fa70d-6f15-4444-b372-437c8c253722', '1fafb8aa-8d8c-4332-a6f5-869b86b9274b');
INSERT INTO public.livro_autor VALUES ('a800eaa2-0c16-45ec-a423-6fa8546c9f54', '1fafb8aa-8d8c-4332-a6f5-869b86b9274b');
INSERT INTO public.livro_autor VALUES ('d6b4c849-d996-47fe-aae1-3bad565967e2', '5a047171-a1b4-423b-ac57-1af7e6eabff8');
INSERT INTO public.livro_autor VALUES ('65e70a0a-c030-404b-8f11-cc4682c54523', '5a047171-a1b4-423b-ac57-1af7e6eabff8');
INSERT INTO public.livro_autor VALUES ('a2c789e8-45b8-42c3-a59d-4ec526b8981c', '5a047171-a1b4-423b-ac57-1af7e6eabff8');
INSERT INTO public.livro_autor VALUES ('a23a88c8-03fa-434c-a818-47fde2b2d4c2', 'b4d68cf2-640e-48cc-9535-51b4e9b6891c');
INSERT INTO public.livro_autor VALUES ('1a38b1c7-81ee-4169-8402-52d5116a1751', 'b4d68cf2-640e-48cc-9535-51b4e9b6891c');
INSERT INTO public.livro_autor VALUES ('859a596d-ad71-4c6a-bc8f-882e5ee7884b', 'b4d68cf2-640e-48cc-9535-51b4e9b6891c');
INSERT INTO public.livro_autor VALUES ('07ba23bb-391b-4a2f-a0be-0536b75d0942', 'b4d68cf2-640e-48cc-9535-51b4e9b6891c');
INSERT INTO public.livro_autor VALUES ('ce89499b-dfed-4b9d-a7a1-92e570dd82a2', 'b4d68cf2-640e-48cc-9535-51b4e9b6891c');
INSERT INTO public.livro_autor VALUES ('4bf623f7-e475-49e1-b43e-b44c5226811c', '0f1b5f93-b796-4f52-b163-aa07d0f78444');


--
-- TOC entry 5367 (class 0 OID 25364)
-- Dependencies: 226
-- Data for Name: livro_categoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.livro_categoria VALUES ('a31c7792-3463-414b-9b30-d79777d64250', '5ae955a5-1124-424e-9de9-0af41067aaca');
INSERT INTO public.livro_categoria VALUES ('0607a558-ce31-4975-b885-0d4c306dcfb5', '51b27445-2f1a-4a7e-98d7-72c39ba86953');
INSERT INTO public.livro_categoria VALUES ('a31c7792-3463-414b-9b30-d79777d64250', '0555b73c-8fd8-48cd-8eb8-87b4a1681eee');
INSERT INTO public.livro_categoria VALUES ('505c95e3-8c4f-44a0-884d-09c4fcc22cae', '0555b73c-8fd8-48cd-8eb8-87b4a1681eee');
INSERT INTO public.livro_categoria VALUES ('a31c7792-3463-414b-9b30-d79777d64250', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('505c95e3-8c4f-44a0-884d-09c4fcc22cae', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('4f11b089-b0e8-4db0-bd41-3d79b297af3b', '0555b73c-8fd8-48cd-8eb8-87b4a1681eee');
INSERT INTO public.livro_categoria VALUES ('c38e2d91-b9ff-4b28-a7b4-9d9890c474f0', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('a716f293-27bd-40e7-a366-840814b9a576', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('c38e2d91-b9ff-4b28-a7b4-9d9890c474f0', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('a716f293-27bd-40e7-a366-840814b9a576', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('c6a0ebd1-c7dd-42f2-82fa-cfb484f5dce6', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('c6a0ebd1-c7dd-42f2-82fa-cfb484f5dce6', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('95454817-b37e-4235-89a8-8f8810809eb0', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('1cf0c81e-4a45-4e95-9f39-262b218d101e', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('1f7a69cd-9186-453e-bb0f-12a8812eabb8', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('6c230999-be58-4ed8-b3e4-e1c2f4ca17df', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('3a87fcb0-38a4-458d-9544-46cb118d01ac', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('4955f646-d1cb-4bcb-b865-fc5706c0bad1', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('2aed9d44-03e7-4f97-a5fa-56ab8d2a1de9', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('be7ac722-726a-4984-8685-c2036229fb0b', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('1173a0fa-a437-412e-8cdd-9e3d61a40062', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('8c088fbc-a7ce-4045-bf1e-341554cf6d6c', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('4f4ae889-11d1-4f4d-be0d-9da83b3b7658', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('5c2d0664-e81e-46dd-846f-2d3d8eec48e9', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('bc5f53ff-8786-4546-9b0a-68442ecd9f63', '08f4e834-8b59-486f-8750-d6d1121f7bfd');
INSERT INTO public.livro_categoria VALUES ('4defb9c5-e36f-4402-8d24-9c6cb81e517d', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('2567c9c4-629b-4293-8d10-59dbe6a57aa5', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('51255f07-da9f-4fef-8e71-874075f5f0cc', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('77325789-8448-4deb-8576-8858bf211cfe', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('dab9a17a-088b-4fe8-a999-91326702a901', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('88f074d8-8dd9-472a-9f09-a378d0de7b44', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('59dabf65-25e4-4c8d-99ef-75fbe26b8ec0', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('c5c1c8c1-6edf-4599-8d3d-fdd1a3254d08', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('6fe665c8-fadb-48bb-8165-cf0e55176739', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('55a21a6a-d5cf-425a-b23d-0fca95b121fa', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('c778e0ae-0307-44aa-a6b6-ed7a2cc25cb9', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('d8b1b4e9-9654-4fc3-b5b7-b282687c4f5a', 'eebde766-3084-402a-9ed1-2c28f4c4786f');
INSERT INTO public.livro_categoria VALUES ('4d020990-d63a-4603-a54c-8bc608bca417', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('54d87f09-8b4b-4282-a002-40bee2d5d415', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('72de0ec1-5a3f-4d88-b07c-c3092438fc4a', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('ec871895-f1f1-4bbe-88f5-7469a69618c5', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('dffd4d0e-ff72-4211-8ab6-e1f69812047d', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('8e0fe1a4-77e5-46f2-a1fa-a972dd1e3f3a', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('9a288131-21d8-4503-9e72-1511a678bd02', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('f14a0378-7a99-4566-b780-476a17a51cfa', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('8cfc5cca-c700-4ed3-831f-ff283449a2c4', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('cbfd341e-457a-4c22-8de4-1fb43fb3a86e', 'b50b33d4-e84c-4383-956b-4d331f33e6e1');
INSERT INTO public.livro_categoria VALUES ('ae89b8cd-c733-4fa0-875c-734d3fec017c', '45691547-b3d8-4b1e-9b61-3fa0fbf72546');
INSERT INTO public.livro_categoria VALUES ('e6e00540-e5e4-433c-97b8-df6cbefe3cd9', '45691547-b3d8-4b1e-9b61-3fa0fbf72546');
INSERT INTO public.livro_categoria VALUES ('bbf25362-4ab7-4354-8ce4-681daf4fa844', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('e6e00540-e5e4-433c-97b8-df6cbefe3cd9', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('6665fd61-077c-45a2-88b4-36a476b5823d', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('12e97a86-0c4f-436d-86aa-15f66095d846', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('03bb0469-5c1d-43bb-9c63-69f80bb87054', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('10a9d52a-edc8-4a28-aac1-ead0ef5d2eba', '9b893aee-fb30-4a85-a635-956933dd309a');
INSERT INTO public.livro_categoria VALUES ('cf09e794-7068-4f77-a40e-20e47c8f2015', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('133f01ba-8544-4eea-8566-6b0518b72f4c', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('f6df2574-7e84-4903-b267-704eae36511d', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('08a2d735-af93-4c10-b9cb-1d447693461c', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('24fbb426-2715-414b-852c-8038423fde52', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('10a9d52a-edc8-4a28-aac1-ead0ef5d2eba', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('b7eedfba-522a-4005-a941-4380958b96d5', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('5b3b6907-4db6-49ad-b9dd-b9d8d4afde97', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('0ac8e3cd-ff29-48bf-aece-869e0a46227d', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('9f38eea2-8182-4c51-827a-2e24378ee27e', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('e5a7e30c-b43e-48b6-b847-f331ed864496', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('6e03c6e6-4bb9-4da8-9cb8-55253e43d2d7', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('c09968f4-f72c-40a5-8c7b-c8121540c978', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('42fdf44f-e9e2-413b-bc97-38fb79d37e4c', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('e74c42a8-6f4a-4309-90cc-40f34da739a7', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('d3634e56-11c6-424c-83c5-6abd801ef1d4', 'c27cb93e-9153-4051-8bd7-9428c56df843');
INSERT INTO public.livro_categoria VALUES ('0f4a9300-7f61-4ec5-963d-9f7fa1c5e03c', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('cb3c4ade-c293-443e-a6cb-8bea8b68cd85', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('d387ec68-7fe1-44e0-b8eb-2f3801380771', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('476bfc48-f0ed-4d7d-a9a6-d047e43662bf', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('34a80fdd-3835-4f7f-9bee-8805b12f8aed', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('c526f18b-0249-463b-ada2-092be4f64da5', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('3b854212-1900-4161-8d64-4c2016cd3734', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('2b2805ca-9f70-4e24-8d19-5a3d956fe24b', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('e20c2384-9944-4ceb-997b-6d048442ab9a', '35e0683a-5df0-4223-8071-490905ba6c70');
INSERT INTO public.livro_categoria VALUES ('b25fa70d-6f15-4444-b372-437c8c253722', 'e1eb9dfc-e28f-4835-85ce-ea10812e24e4');
INSERT INTO public.livro_categoria VALUES ('a800eaa2-0c16-45ec-a423-6fa8546c9f54', 'e1eb9dfc-e28f-4835-85ce-ea10812e24e4');
INSERT INTO public.livro_categoria VALUES ('d6b4c849-d996-47fe-aae1-3bad565967e2', 'e1eb9dfc-e28f-4835-85ce-ea10812e24e4');
INSERT INTO public.livro_categoria VALUES ('65e70a0a-c030-404b-8f11-cc4682c54523', 'e1eb9dfc-e28f-4835-85ce-ea10812e24e4');
INSERT INTO public.livro_categoria VALUES ('a2c789e8-45b8-42c3-a59d-4ec526b8981c', 'e1eb9dfc-e28f-4835-85ce-ea10812e24e4');
INSERT INTO public.livro_categoria VALUES ('0607a558-ce31-4975-b885-0d4c306dcfb5', 'c3ca37ab-9a94-4c07-9f42-df09ec033482');
INSERT INTO public.livro_categoria VALUES ('b632063a-4b48-492a-a926-8df0cef98e58', 'c3ca37ab-9a94-4c07-9f42-df09ec033482');
INSERT INTO public.livro_categoria VALUES ('de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5', 'c3ca37ab-9a94-4c07-9f42-df09ec033482');
INSERT INTO public.livro_categoria VALUES ('660b70a6-05e7-4df1-8dc7-b01cf7cc9108', 'c3ca37ab-9a94-4c07-9f42-df09ec033482');
INSERT INTO public.livro_categoria VALUES ('5cea5e32-fc3e-418f-a65c-5cb9fced700f', 'c3ca37ab-9a94-4c07-9f42-df09ec033482');
INSERT INTO public.livro_categoria VALUES ('d8557e14-a776-4e80-9210-00367b67d3db', 'c3ca37ab-9a94-4c07-9f42-df09ec033482');
INSERT INTO public.livro_categoria VALUES ('9476c42a-5846-4068-abc3-20aeb0a58304', 'cc7cf809-dce5-4e2b-ba98-d8fd714b3311');
INSERT INTO public.livro_categoria VALUES ('65b839a4-c8a8-4dc7-ad44-e6ac497760ff', 'cc7cf809-dce5-4e2b-ba98-d8fd714b3311');


--
-- TOC entry 5399 (class 0 OID 51115)
-- Dependencies: 264
-- Data for Name: moods; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.moods VALUES (1, 'fantasy', 'Fantasia', '#7C3AED', '#F59E0B', '#8B5CF6', '#6D28D9', '#7C3AED', '✨', 'Mundos além da imaginação, onde tudo é possível');
INSERT INTO public.moods VALUES (2, 'mystery', 'Mistério', '#1E3A5F', '#0D9488', '#1E4080', '#0F2744', '#1E3A5F', '🔍', 'Segredos que sussurram nas páginas da escuridão');
INSERT INTO public.moods VALUES (3, 'romance', 'Romance', '#EC4899', '#F97316', '#F472B6', '#DB2777', '#EC4899', '💕', 'Histórias que fazem o coração bater mais forte');
INSERT INTO public.moods VALUES (4, 'adventure', 'Aventura', '#EA580C', '#16A34A', '#F97316', '#C2410C', '#EA580C', '⚔️', 'Jornadas épicas para além do horizonte conhecido');
INSERT INTO public.moods VALUES (5, 'academic', 'Acadêmico', '#1D4ED8', '#CA8A04', '#2563EB', '#1E40AF', '#1D4ED8', '📚', 'Conhecimento que transforma e expande horizontes');
INSERT INTO public.moods VALUES (6, 'comedy', 'Comédia', '#EAB308', '#84CC16', '#FCD34D', '#CA8A04', '#EAB308', '😄', 'Leveza e humor que iluminam os dias cinzas');
INSERT INTO public.moods VALUES (7, 'drama', 'Drama', '#9F1239', '#B45309', '#BE123C', '#881337', '#9F1239', '🎭', 'Emoções intensas que ecoam muito além da última página');
INSERT INTO public.moods VALUES (8, 'horror', 'Terror', '#111827', '#16A34A', '#1F2937', '#030712', '#16A34A', '👻', 'Tensão e arrepio que prendem a respiração');
INSERT INTO public.moods VALUES (9, 'scifi', 'Ficção Científica', '#0891B2', '#6366F1', '#06B6D4', '#0E7490', '#0891B2', '🚀', 'Futuros possíveis e universos inexplorados');
INSERT INTO public.moods VALUES (10, 'inspirational', 'Inspiracional', '#D97706', '#EA580C', '#F59E0B', '#B45309', '#D97706', '🌟', 'Histórias reais que provam que tudo é possível');


--
-- TOC entry 5387 (class 0 OID 42799)
-- Dependencies: 249
-- Data for Name: notificacao; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.notificacao VALUES (6, '00000000-0000-0000-0000-000000000002', 'reserva_disponivel', 'Livro disponível para retirada', 'Seu livro "A Garota no Trem" está pronto para retirada na biblioteca. Retire até 19/11/2025.', false, '2025-11-14 21:45:10.609696', '2025-11-16 21:45:10.609696', '2025-11-16 21:45:10.609696');
INSERT INTO public.notificacao VALUES (7, '00000000-0000-0000-0000-000000000002', 'lembrete_devolucao', 'Lembrete: Devolução de livro', 'O prazo de devolução do livro "1984" está próximo. Devolva até 25/11/2025.', false, '2025-11-15 21:45:10.611225', '2025-11-16 21:45:10.611225', '2025-11-16 21:45:10.611225');
INSERT INTO public.notificacao VALUES (8, '00000000-0000-0000-0000-000000000002', 'multa', 'Multa aplicada', 'Uma multa de R$ 5,00 foi aplicada devido ao atraso na devolução. Acesse a área financeira para mais detalhes.', false, '2025-11-16 18:45:10.611791', '2025-11-16 21:45:10.611791', '2025-11-16 21:45:10.611791');
INSERT INTO public.notificacao VALUES (9, '00000000-0000-0000-0000-000000000002', 'reserva_expirada', 'Reserva expirada', 'Sua reserva do livro "Drácula" expirou. Faça uma nova reserva se ainda tiver interesse.', true, '2025-11-08 21:45:10.612279', '2025-11-16 21:45:10.612279', '2025-11-16 21:45:10.612279');
INSERT INTO public.notificacao VALUES (10, '00000000-0000-0000-0000-000000000002', 'sistema', 'Bem-vindo ao Bibliotech!', 'Seja bem-vindo à nossa biblioteca digital. Explore nosso catálogo e aproveite!', true, '2025-10-17 21:45:10.61293', '2025-11-16 21:45:10.61293', '2025-11-16 21:45:10.61293');


--
-- TOC entry 5396 (class 0 OID 51075)
-- Dependencies: 261
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5385 (class 0 OID 42752)
-- Dependencies: 244
-- Data for Name: notifications_sent; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5370 (class 0 OID 42496)
-- Dependencies: 229
-- Data for Name: pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5375 (class 0 OID 42638)
-- Dependencies: 234
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.permissions VALUES (1, 'can_view_users', 'Visualizar Utilizadores', 'Pode ver a lista de utilizadores', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (2, 'can_create_user', 'Criar Utilizador', 'Pode criar novos utilizadores', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (3, 'can_edit_user', 'Editar Utilizador', 'Pode editar dados de utilizadores', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (4, 'can_delete_user', 'Deletar Utilizador', 'Pode remover utilizadores do sistema', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (5, 'can_block_user', 'Bloquear Utilizador', 'Pode bloquear/desbloquear utilizadores', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (6, 'can_assign_role', 'Atribuir Grupo', 'Pode atribuir roles a utilizadores', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (7, 'can_notify_user', 'Notificar Utilizador', 'Pode enviar notificações manuais', 'usuarios', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (8, 'can_view_books', 'Visualizar Livros', 'Pode ver o catálogo de livros', 'livros', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (9, 'can_create_book', 'Criar Livro', 'Pode adicionar novos livros', 'livros', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (10, 'can_edit_book', 'Editar Livro', 'Pode editar informações de livros', 'livros', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (11, 'can_delete_book', 'Deletar Livro', 'Pode remover livros do acervo', 'livros', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (12, 'can_import_books', 'Importar Livros', 'Pode fazer importação em lote (CSV)', 'livros', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (13, 'can_view_loans', 'Visualizar Empréstimos', 'Pode ver empréstimos', 'emprestimos', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (14, 'can_create_loan', 'Criar Empréstimo', 'Pode registrar empréstimos', 'emprestimos', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (15, 'can_approve_loan', 'Aprovar Empréstimo', 'Pode aprovar pedidos de empréstimo', 'emprestimos', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (16, 'can_return_book', 'Registrar Devolução', 'Pode registrar devoluções', 'emprestimos', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (17, 'can_view_reservations', 'Visualizar Reservas', 'Pode ver reservas', 'reservas', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (18, 'can_create_reservation', 'Criar Reserva', 'Pode fazer reservas de livros', 'reservas', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (19, 'can_cancel_reservation', 'Cancelar Reserva', 'Pode cancelar reservas', 'reservas', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (20, 'can_view_logs', 'Visualizar Logs', 'Pode acessar logs de auditoria', 'sistema', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (21, 'can_manage_roles', 'Gerenciar Permissões', 'Pode criar e editar grupos de permissão', 'sistema', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (22, 'can_view_dashboard', 'Ver Dashboard Admin', 'Acesso ao painel administrativo', 'sistema', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (23, 'can_manage_domains', 'Gerenciar Domínios', 'Pode gerenciar domínios permitidos', 'sistema', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (24, 'can_view_reports', 'Visualizar Relatórios', 'Pode acessar relatórios do sistema', 'sistema', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (25, 'can_manage_categories', 'Gerenciar Categorias', 'Pode criar/editar categorias', 'sistema', '2025-11-10 19:42:31.112725');
INSERT INTO public.permissions VALUES (26, 'can_manage_authors', 'Gerenciar Autores', 'Pode criar/editar autores', 'sistema', '2025-11-10 19:42:31.112725');


--
-- TOC entry 5397 (class 0 OID 51097)
-- Dependencies: 262
-- Data for Name: preferencias_aluno; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.preferencias_aluno VALUES ('90b48d67-1dcd-44e3-9c53-5f3a682eb46d', '00000000-0000-0000-0000-000000000002', 'categoria', 'Autoajuda', '2026-05-01 21:12:55.846628');
INSERT INTO public.preferencias_aluno VALUES ('4849c4dc-f2c1-4b86-aa49-aebf4f5583d0', '00000000-0000-0000-0000-000000000002', 'categoria', 'Clássicos', '2026-05-01 21:12:55.846628');
INSERT INTO public.preferencias_aluno VALUES ('5191af3f-fcc2-4abe-9b84-3c941cb3643f', '00000000-0000-0000-0000-000000000002', 'categoria', 'HQ / Mangá', '2026-05-01 21:12:55.846628');
INSERT INTO public.preferencias_aluno VALUES ('84870ac2-d113-49d1-afd0-37050fad9491', '00000000-0000-0000-0000-000000000002', 'autor', 'Alexandre Dumas', '2026-05-01 21:12:55.846628');
INSERT INTO public.preferencias_aluno VALUES ('204b10a6-eff6-4030-9f92-8f17924dd5b4', '00000000-0000-0000-0000-000000000002', 'autor', 'Bram Stoker', '2026-05-01 21:12:55.846628');
INSERT INTO public.preferencias_aluno VALUES ('53ca652c-e3ac-4fc1-ba98-872f51f982d7', '00000000-0000-0000-0000-000000000002', 'autor', 'Carlos Drummond de Andrade', '2026-05-01 21:12:55.846628');


--
-- TOC entry 5365 (class 0 OID 25331)
-- Dependencies: 224
-- Data for Name: reserva; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.reserva VALUES ('5b6d4d4e-a619-4f49-8d21-a488f07b832c', '2025-06-25 19:53:45.344677-03', 'ativa', '2025-06-28', '00000000-0000-0000-0000-000000000007', 'a31c7792-3463-414b-9b30-d79777d64250');
INSERT INTO public.reserva VALUES ('718618cf-5815-4c51-9c0f-ee0ded61b1e3', '2025-06-25 19:53:45.344677-03', 'ativa', '2025-06-28', '00000000-0000-0000-0000-000000000004', '4d020990-d63a-4603-a54c-8bc608bca417');
INSERT INTO public.reserva VALUES ('7bad6a9f-7274-4e18-9275-d802fd3985a2', '2025-11-14 21:45:10.592983-03', 'disponivel', '2025-11-19', '00000000-0000-0000-0000-000000000002', '61240bdc-306e-47d4-8b85-5e0b36bc5531');
INSERT INTO public.reserva VALUES ('12293987-484b-4a7a-8dcd-b4909083da96', '2025-11-15 21:45:10.602551-03', 'aguardando', '2025-11-23', '00000000-0000-0000-0000-000000000002', 'b632063a-4b48-492a-a926-8df0cef98e58');
INSERT INTO public.reserva VALUES ('ede46e8f-4502-4b3d-bd2c-0f622e2a9aff', '2025-11-06 21:45:10.604505-03', 'concluido', '2025-11-13', '00000000-0000-0000-0000-000000000002', '0607a558-ce31-4975-b885-0d4c306dcfb5');
INSERT INTO public.reserva VALUES ('b75cd4c5-42d4-4de9-9115-de566ddd9e0c', '2025-11-01 21:45:10.606484-03', 'expirado', '2025-11-08', '00000000-0000-0000-0000-000000000002', '2567c9c4-629b-4293-8d10-59dbe6a57aa5');
INSERT INTO public.reserva VALUES ('87061d03-44e3-41fc-9206-e50e52166556', '2025-11-11 21:45:10.608306-03', 'cancelado', '2025-11-18', '00000000-0000-0000-0000-000000000002', '2122fcb8-041a-424f-8201-12292261b312');


--
-- TOC entry 5395 (class 0 OID 51037)
-- Dependencies: 257
-- Data for Name: respostas_comentario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.respostas_comentario VALUES (1, 'autor', 1, '00000000-0000-0000-0000-000000000004', 'Excelente análise. Penso exatamente o mesmo!', '2025-11-14 20:23:06.274585');
INSERT INTO public.respostas_comentario VALUES (2, 'autor', 3, '00000000-0000-0000-0000-000000000004', 'Concordo totalmente! Esse autor é incrível.', '2025-11-07 20:23:06.286437');
INSERT INTO public.respostas_comentario VALUES (3, 'autor', 4, '00000000-0000-0000-0000-000000000004', 'Perfeito! Não poderia ter descrito melhor.', '2025-11-16 20:23:06.290402');
INSERT INTO public.respostas_comentario VALUES (4, 'autor', 6, '00000000-0000-0000-0000-000000000004', 'Perfeito! Não poderia ter descrito melhor.', '2025-11-14 20:23:06.295579');
INSERT INTO public.respostas_comentario VALUES (5, 'autor', 12, '00000000-0000-0000-0000-000000000004', 'Concordo totalmente! Esse autor é incrível.', '2025-11-11 20:23:06.313865');
INSERT INTO public.respostas_comentario VALUES (6, 'livro', 1, '00000000-0000-0000-0000-000000000006', 'Penso o mesmo! Este livro é fantástico.', '2025-11-18 20:23:06.319051');


--
-- TOC entry 5363 (class 0 OID 25297)
-- Dependencies: 222
-- Data for Name: resumo_ia; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.resumo_ia VALUES ('f1dc380f-92ba-4bdf-8977-198e9acb7c5e', 'Uma distopia sombria onde Big Brother observa tudo. Winston Smith luta contra a tirania totalitária que controla até os pensamentos. Um clássico sobre vigilância, manipulação e resistência.', '2025-11-18 20:21:11.487546-03', 'gpt-4-turbo', 'a31c7792-3463-414b-9b30-d79777d64250');
INSERT INTO public.resumo_ia VALUES ('14cf761d-a852-44d3-b6b1-d988f1d9d7d8', 'Uma obra fascinante que explora temas profundos da condição humana. "A Garota no Trem" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.502009-03', 'gpt-4-turbo', '61240bdc-306e-47d4-8b85-5e0b36bc5531');
INSERT INTO public.resumo_ia VALUES ('092a5296-1438-4f22-96a2-f91bad9907d5', 'Uma obra fascinante que explora temas profundos da condição humana. "A Máquina do Tempo" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.5049-03', 'gpt-4-turbo', 'd1bd2185-0e27-427e-aecb-0f87e592c6c6');
INSERT INTO public.resumo_ia VALUES ('802c5d45-53b7-4e6e-b2b8-bbb73d493fb8', 'Uma obra fascinante que explora temas profundos da condição humana. "A Menina que Roubava Livros" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.506954-03', 'gpt-4-turbo', '9476c42a-5846-4068-abc3-20aeb0a58304');
INSERT INTO public.resumo_ia VALUES ('b2eabc70-62bb-47c3-8fb3-03e819507290', 'Uma obra fascinante que explora temas profundos da condição humana. "A Metamorfose" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.508436-03', 'gpt-4-turbo', 'cf09e794-7068-4f77-a40e-20e47c8f2015');
INSERT INTO public.resumo_ia VALUES ('b8650846-94c8-4673-8f20-0af7b29992f8', 'Animais expulsam fazendeiro e criam sociedade igualitária. Porcos assumem poder e se tornam tão tiranos quanto humanos. Alegoria devastadora sobre corrupção de ideais revolucionários.', '2025-11-18 20:21:11.510159-03', 'gpt-4-turbo', '1cf0c81e-4a45-4e95-9f39-262b218d101e');
INSERT INTO public.resumo_ia VALUES ('d4437b3f-070e-4443-b7cc-1541a94c08f0', 'Uma obra fascinante que explora temas profundos da condição humana. "Capitães da Areia" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.512038-03', 'gpt-4-turbo', '0f4a9300-7f61-4ec5-963d-9f7fa1c5e03c');
INSERT INTO public.resumo_ia VALUES ('1bd6f96b-1fa9-45e6-b7a9-e377ef8c147d', 'Bentinho narra sua vida e o tormento do ciúme de Capitu. Será que ela o traiu com Escobar? Um mistério psicológico sobre memória, paixão e a natureza humana narrado por um protagonista pouco confiável.', '2025-11-18 20:21:11.51379-03', 'gpt-4-turbo', 'c38e2d91-b9ff-4b28-a7b4-9d9890c474f0');
INSERT INTO public.resumo_ia VALUES ('8981915a-ff83-4343-946d-a80ad9bbfea0', 'Uma obra fascinante que explora temas profundos da condição humana. "Drácula" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.515959-03', 'gpt-4-turbo', '2567c9c4-629b-4293-8d10-59dbe6a57aa5');
INSERT INTO public.resumo_ia VALUES ('3fd282d1-3f06-43e0-b9b8-d9cb17d29382', 'Uma obra fascinante que explora temas profundos da condição humana. "Frankenstein" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.518095-03', 'gpt-4-turbo', '4defb9c5-e36f-4402-8d24-9c6cb81e517d');
INSERT INTO public.resumo_ia VALUES ('71861e38-bf5d-4a74-b2fa-f23a9f7ed046', 'Uma obra fascinante que explora temas profundos da condição humana. "O Alquimista" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.519599-03', 'gpt-4-turbo', 'b632063a-4b48-492a-a926-8df0cef98e58');
INSERT INTO public.resumo_ia VALUES ('d06df24f-348a-486a-9e30-bcaccbf7c735', 'Retrato naturalista de um cortiço carioca no século XIX. João Romão explora os moradores enquanto busca ascensão social. Crítica social sobre pobreza, ambição e determinismo ambiental.', '2025-11-18 20:21:11.520918-03', 'gpt-4-turbo', '2122fcb8-041a-424f-8201-12292261b312');
INSERT INTO public.resumo_ia VALUES ('1c448d06-5aaf-4f8f-a870-26cce07c367e', 'Uma obra fascinante que explora temas profundos da condição humana. "O Diário de Anne Frank" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.522143-03', 'gpt-4-turbo', '2cb63c63-7f42-4429-8194-228c4ea56764');
INSERT INTO public.resumo_ia VALUES ('f88d35d0-ac9c-47ec-9eaa-3fec5fc6cb66', 'Bilbo Baggins é arrastado para uma aventura com 13 anões e o mago Gandalf. Enfrentam trolls, goblins e o dragão Smaug para recuperar o tesouro da Montanha Solitária. Clássico da fantasia.', '2025-11-18 20:21:11.523485-03', 'gpt-4-turbo', '6c230999-be58-4ed8-b3e4-e1c2f4ca17df');
INSERT INTO public.resumo_ia VALUES ('16461627-a6b6-4a3a-a7c1-4c2549d338ea', 'Uma obra fascinante que explora temas profundos da condição humana. "O Morro dos Ventos Uivantes" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.525366-03', 'gpt-4-turbo', '4ee2f79a-5a7b-4c42-ab19-891617066af6');
INSERT INTO public.resumo_ia VALUES ('4313d512-8903-40bf-ab29-8b882f1d3db6', 'Um piloto perdido no deserto encontra o Pequeno Príncipe, que conta sobre sua jornada por diferentes planetas. Fábula poética sobre amizade, amor e o sentido da vida.', '2025-11-18 20:21:11.526805-03', 'gpt-4-turbo', 'de7b3f38-e3e6-44c5-bce3-cc99dcfc42b5');
INSERT INTO public.resumo_ia VALUES ('0fe30c82-1430-4f34-9798-7064dd3bb057', 'Um piloto perdido no deserto encontra o Pequeno Príncipe, que conta sobre sua jornada por diferentes planetas. Fábula poética sobre amizade, amor e o sentido da vida.', '2025-11-18 20:21:11.529064-03', 'gpt-4-turbo', '0607a558-ce31-4975-b885-0d4c306dcfb5');
INSERT INTO public.resumo_ia VALUES ('fd101ca3-cd7a-403b-b912-5355c9c7717a', 'Uma obra fascinante que explora temas profundos da condição humana. "O Silêncio dos Inocentes" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.530597-03', 'gpt-4-turbo', '4d020990-d63a-4603-a54c-8bc608bca417');
INSERT INTO public.resumo_ia VALUES ('c9a0eae4-e2cf-4baf-960e-c31e29e6e87c', 'Uma obra fascinante que explora temas profundos da condição humana. "Orgulho e Preconceito" é uma leitura envolvente que combina narrativa cativante com reflexões sobre sociedade, moralidade e natureza humana.', '2025-11-18 20:21:11.532582-03', 'gpt-4-turbo', 'bbf25362-4ab7-4354-8ce4-681daf4fa844');
INSERT INTO public.resumo_ia VALUES ('e3795b1f-ab1f-4354-aa8e-6fea77370a35', 'Aurélia compra seu próprio casamento para vingar-se de Seixas, que a rejeitou por dinheiro. Romance urbano sobre orgulho, mercantilização do amor e redenção na sociedade carioca oitocentista.', '2025-11-18 20:21:11.53429-03', 'gpt-4-turbo', '187be390-949a-4799-8edb-93a49c5f05e4');


--
-- TOC entry 5379 (class 0 OID 42669)
-- Dependencies: 238
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.role_permissions VALUES (1, 1, 1, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (2, 1, 2, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (3, 1, 3, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (4, 1, 4, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (5, 1, 5, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (6, 1, 6, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (7, 1, 7, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (8, 1, 8, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (9, 1, 9, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (10, 1, 10, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (11, 1, 11, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (12, 1, 12, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (13, 1, 13, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (14, 1, 14, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (15, 1, 15, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (16, 1, 16, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (17, 1, 17, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (18, 1, 18, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (19, 1, 19, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (20, 1, 20, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (21, 1, 21, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (22, 1, 22, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (23, 1, 23, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (24, 1, 24, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (25, 1, 25, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (26, 1, 26, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (27, 2, 1, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (28, 2, 2, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (29, 2, 3, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (30, 2, 5, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (31, 2, 8, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (32, 2, 9, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (33, 2, 10, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (34, 2, 11, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (35, 2, 12, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (36, 2, 13, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (37, 2, 14, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (38, 2, 15, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (39, 2, 16, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (40, 2, 17, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (41, 2, 19, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (42, 2, 20, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (43, 2, 22, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (44, 2, 24, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (45, 2, 25, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (46, 2, 26, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (47, 3, 1, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (48, 3, 8, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (49, 3, 13, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (50, 3, 14, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (51, 3, 16, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (52, 3, 17, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (53, 3, 22, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (54, 4, 8, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (55, 4, 18, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (56, 4, 19, '2025-11-10 19:42:31.112725');
INSERT INTO public.role_permissions VALUES (57, 6, 15, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (58, 6, 6, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (59, 6, 5, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (60, 6, 19, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (61, 6, 9, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (62, 6, 14, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (63, 6, 18, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (64, 6, 2, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (65, 6, 11, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (66, 6, 4, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (67, 6, 10, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (68, 6, 3, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (69, 6, 12, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (70, 6, 26, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (71, 6, 25, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (72, 6, 23, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (73, 6, 21, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (74, 6, 7, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (75, 6, 16, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (76, 6, 8, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (77, 6, 22, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (78, 6, 13, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (79, 6, 20, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (80, 6, 24, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (81, 6, 17, '2025-11-10 20:28:29.327586');
INSERT INTO public.role_permissions VALUES (82, 6, 1, '2025-11-10 20:28:29.327586');


--
-- TOC entry 5377 (class 0 OID 42652)
-- Dependencies: 236
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles VALUES (1, 'SuperAdmin', 'Administrador com acesso total ao sistema', true, true, '2025-11-10 19:42:31.112725', '2025-11-10 19:42:31.112725');
INSERT INTO public.roles VALUES (2, 'Bibliotecário Sênior', 'Gestão completa de acervo, empréstimos e utilizadores', true, true, '2025-11-10 19:42:31.112725', '2025-11-10 19:42:31.112725');
INSERT INTO public.roles VALUES (3, 'Bibliotecário Júnior', 'Operações básicas de empréstimo e consulta', true, true, '2025-11-10 19:42:31.112725', '2025-11-10 19:42:31.112725');
INSERT INTO public.roles VALUES (4, 'Aluno', 'Utilizador padrão com acesso de leitura e reservas', true, true, '2025-11-10 19:42:31.112725', '2025-11-10 19:42:31.112725');
INSERT INTO public.roles VALUES (6, 'Admin', 'Administrador do sistema com acesso total', false, true, '2025-11-10 20:28:29.327586', '2025-11-10 20:28:29.327586');


--
-- TOC entry 5359 (class 0 OID 25256)
-- Dependencies: 218
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000001', 'Admin Teste', 'admin.teste@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7LjOZEgQI/5IwxWS', 'bibliotecario', '2025-06-24 00:20:08.256639-03', 'https://img.freepik.com/fotos-gratis/retrato-de-homem-de-negocios-usando-terno-formal_23-2148939117.jpg?semt=ais_items_boosted&w=740', NULL, false, NULL, 2, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000003', 'Ana Beatriz Marques', 'ana.marques@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7l', 'aluno', '2025-06-24 23:29:38.743056-03', 'https://marista.edu.br/wp-content/uploads/2022/07/EF1.png', NULL, false, NULL, 4, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000004', 'Carlos Eduardo Lima', 'carlos.lima@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7l', 'aluno', '2025-06-24 23:29:38.743056-03', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', NULL, false, NULL, 4, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000005', 'Fernanda Rocha Silva', 'fernanda.rocha@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7l', 'aluno', '2025-06-24 23:29:38.743056-03', 'https://www.agenciabrasilia.df.gov.br/documents/d/guest/dia-do-estudante-santa-maria-jpg', NULL, false, NULL, 4, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000006', 'Lucas Henrique Alves', 'lucas.alves@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7l', 'aluno', '2025-06-24 23:29:38.743056-03', 'https://maxicuiaba.com.br/wp-content/uploads/2021/06/sem-titulo-38.jpg', NULL, false, NULL, 4, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000002', 'Aluno Teste', 'aluno.teste@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7LjOZEgQI/5IwxWS', 'aluno', '2025-06-24 00:20:08.258907-03', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9r4zvgWrXNv1e7lbVa8re3VyaLTjT-m53w&s', NULL, false, NULL, 4, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('00000000-0000-0000-0000-000000000007', 'Mariana Costa Freitas', 'mariana.freitas@email.com', '$2b$10$hHTil2hUAQjVthcUvoOY9uf84OEhRtQTEW2mp7l', 'aluno', '2025-06-24 23:29:38.743056-03', 'https://i.ytimg.com/vi/Cq-tEEbB1Rk/maxresdefault.jpg', NULL, false, NULL, 4, false, NULL, NULL, NULL, NULL);
INSERT INTO public.usuario VALUES ('79423106-73b8-4c44-b803-f01333b4c9bb', 'Administrador do Sistema', 'admin@bibliotech.com', '$2b$10$DtyLBMJgB.bj5mvyofZUCO7twt05Y27H6nZ0pXgFeJJnjIKWPOFAi', 'admin', '2025-11-10 20:16:12.8348-03', NULL, NULL, false, NULL, 6, false, NULL, NULL, NULL, NULL);


--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 239
-- Name: access_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.access_logs_id_seq', 145, true);


--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 265
-- Name: ai_book_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_book_metadata_id_seq', 1, false);


--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 241
-- Name: audit_trail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_trail_id_seq', 1, false);


--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 252
-- Name: avaliacoes_autor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.avaliacoes_autor_id_seq', 12, true);


--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 250
-- Name: avaliacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.avaliacoes_id_seq', 5, true);


--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 254
-- Name: curtidas_comentario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.curtidas_comentario_id_seq', 39, true);


--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 231
-- Name: dominios_permitidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dominios_permitidos_id_seq', 1, false);


--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 267
-- Name: integrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.integrations_id_seq', 1, false);


--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 263
-- Name: moods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.moods_id_seq', 20, true);


--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 248
-- Name: notificacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notificacao_id_seq', 10, true);


--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 243
-- Name: notifications_sent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_sent_id_seq', 1, false);


--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 233
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 26, true);


--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 256
-- Name: respostas_comentario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.respostas_comentario_id_seq', 6, true);


--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 237
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 82, true);


--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 235
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 6, true);


--
-- TOC entry 5061 (class 2606 OID 25481)
-- Name: Auditoria_Acoes Auditoria_Acoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Auditoria_Acoes"
    ADD CONSTRAINT "Auditoria_Acoes_pkey" PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 25421)
-- Name: Transacao_Financeira Transacao_Financeira_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transacao_Financeira"
    ADD CONSTRAINT "Transacao_Financeira_pkey" PRIMARY KEY (id);


--
-- TOC entry 5092 (class 2606 OID 42717)
-- Name: access_logs access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5156 (class 2606 OID 51152)
-- Name: ai_book_metadata ai_book_metadata_book_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_book_metadata
    ADD CONSTRAINT ai_book_metadata_book_id_unique UNIQUE (book_id);


--
-- TOC entry 5158 (class 2606 OID 51150)
-- Name: ai_book_metadata ai_book_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_book_metadata
    ADD CONSTRAINT ai_book_metadata_pkey PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 42739)
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (id);


--
-- TOC entry 5027 (class 2606 OID 32824)
-- Name: autor autor_nome_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autor
    ADD CONSTRAINT autor_nome_key UNIQUE (nome);


--
-- TOC entry 5029 (class 2606 OID 25275)
-- Name: autor autor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autor
    ADD CONSTRAINT autor_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 51000)
-- Name: avaliacoes_autor avaliacoes_autor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes_autor
    ADD CONSTRAINT avaliacoes_autor_pkey PRIMARY KEY (id);


--
-- TOC entry 5118 (class 2606 OID 42893)
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- TOC entry 5032 (class 2606 OID 25285)
-- Name: categoria categoria_nome_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_nome_key UNIQUE (nome);


--
-- TOC entry 5034 (class 2606 OID 25283)
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id);


--
-- TOC entry 5132 (class 2606 OID 51025)
-- Name: curtidas_comentario curtidas_comentario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curtidas_comentario
    ADD CONSTRAINT curtidas_comentario_pkey PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 42566)
-- Name: dominios_permitidos dominios_permitidos_dominio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dominios_permitidos
    ADD CONSTRAINT dominios_permitidos_dominio_key UNIQUE (dominio);


--
-- TOC entry 5070 (class 2606 OID 42564)
-- Name: dominios_permitidos dominios_permitidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dominios_permitidos
    ADD CONSTRAINT dominios_permitidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5046 (class 2606 OID 25320)
-- Name: emprestimo emprestimo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emprestimo
    ADD CONSTRAINT emprestimo_pkey PRIMARY KEY (id);


--
-- TOC entry 5162 (class 2606 OID 51178)
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5164 (class 2606 OID 51180)
-- Name: integrations integrations_provider_library_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_provider_library_unique UNIQUE (provider, library_id);


--
-- TOC entry 5066 (class 2606 OID 42520)
-- Name: item_pedido item_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_pedido
    ADD CONSTRAINT item_pedido_pkey PRIMARY KEY (id);


--
-- TOC entry 5054 (class 2606 OID 25353)
-- Name: livro_autor livro_autor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro_autor
    ADD CONSTRAINT livro_autor_pkey PRIMARY KEY (livro_id, autor_id);


--
-- TOC entry 5056 (class 2606 OID 25368)
-- Name: livro_categoria livro_categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro_categoria
    ADD CONSTRAINT livro_categoria_pkey PRIMARY KEY (livro_id, categoria_id);


--
-- TOC entry 5038 (class 2606 OID 25296)
-- Name: livro livro_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro
    ADD CONSTRAINT livro_isbn_key UNIQUE (isbn);


--
-- TOC entry 5040 (class 2606 OID 25294)
-- Name: livro livro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro
    ADD CONSTRAINT livro_pkey PRIMARY KEY (id);


--
-- TOC entry 5152 (class 2606 OID 51122)
-- Name: moods moods_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moods
    ADD CONSTRAINT moods_key_key UNIQUE (key);


--
-- TOC entry 5154 (class 2606 OID 51120)
-- Name: moods moods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moods
    ADD CONSTRAINT moods_pkey PRIMARY KEY (id);


--
-- TOC entry 5116 (class 2606 OID 42810)
-- Name: notificacao notificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacao
    ADD CONSTRAINT notificacao_pkey PRIMARY KEY (id);


--
-- TOC entry 5145 (class 2606 OID 51084)
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- TOC entry 5114 (class 2606 OID 42762)
-- Name: notifications_sent notifications_sent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications_sent
    ADD CONSTRAINT notifications_sent_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 42504)
-- Name: pedido pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (id);


--
-- TOC entry 5076 (class 2606 OID 42648)
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- TOC entry 5078 (class 2606 OID 42646)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5148 (class 2606 OID 51106)
-- Name: preferencias_aluno preferencias_aluno_aluno_id_tipo_valor_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias_aluno
    ADD CONSTRAINT preferencias_aluno_aluno_id_tipo_valor_key UNIQUE (aluno_id, tipo, valor);


--
-- TOC entry 5150 (class 2606 OID 51104)
-- Name: preferencias_aluno preferencias_aluno_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias_aluno
    ADD CONSTRAINT preferencias_aluno_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 25338)
-- Name: reserva reserva_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_pkey PRIMARY KEY (id);


--
-- TOC entry 5142 (class 2606 OID 51046)
-- Name: respostas_comentario respostas_comentario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas_comentario
    ADD CONSTRAINT respostas_comentario_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 25307)
-- Name: resumo_ia resumo_ia_livro_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumo_ia
    ADD CONSTRAINT resumo_ia_livro_id_key UNIQUE (livro_id);


--
-- TOC entry 5044 (class 2606 OID 25305)
-- Name: resumo_ia resumo_ia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumo_ia
    ADD CONSTRAINT resumo_ia_pkey PRIMARY KEY (id);


--
-- TOC entry 5088 (class 2606 OID 42675)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5090 (class 2606 OID 42677)
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- TOC entry 5082 (class 2606 OID 42665)
-- Name: roles roles_nome_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nome_key UNIQUE (nome);


--
-- TOC entry 5084 (class 2606 OID 42663)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5130 (class 2606 OID 51002)
-- Name: avaliacoes_autor unique_usuario_autor; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes_autor
    ADD CONSTRAINT unique_usuario_autor UNIQUE (autor_id, usuario_id);


--
-- TOC entry 5137 (class 2606 OID 51027)
-- Name: curtidas_comentario unique_usuario_comentario_curtida; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curtidas_comentario
    ADD CONSTRAINT unique_usuario_comentario_curtida UNIQUE (tipo_comentario, comentario_id, usuario_id);


--
-- TOC entry 5122 (class 2606 OID 42895)
-- Name: avaliacoes unique_usuario_livro; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT unique_usuario_livro UNIQUE (usuario_id, livro_id);


--
-- TOC entry 5019 (class 2606 OID 25383)
-- Name: usuario usuario_codigo_acesso_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_codigo_acesso_key UNIQUE (codigo_acesso);


--
-- TOC entry 5021 (class 2606 OID 25267)
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- TOC entry 5023 (class 2606 OID 42576)
-- Name: usuario usuario_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_google_id_key UNIQUE (google_id);


--
-- TOC entry 5025 (class 2606 OID 25265)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 5093 (class 1259 OID 42729)
-- Name: idx_access_logs_active_sessions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_active_sessions ON public.access_logs USING btree (is_active, usuario_id, last_seen DESC) WHERE (is_active = true);


--
-- TOC entry 5094 (class 1259 OID 42724)
-- Name: idx_access_logs_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_email ON public.access_logs USING btree (email);


--
-- TOC entry 5095 (class 1259 OID 42727)
-- Name: idx_access_logs_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_is_active ON public.access_logs USING btree (is_active);


--
-- TOC entry 5096 (class 1259 OID 42728)
-- Name: idx_access_logs_last_seen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_last_seen ON public.access_logs USING btree (last_seen DESC);


--
-- TOC entry 5097 (class 1259 OID 42725)
-- Name: idx_access_logs_login_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_login_time ON public.access_logs USING btree (login_time DESC);


--
-- TOC entry 5098 (class 1259 OID 42726)
-- Name: idx_access_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_status ON public.access_logs USING btree (status);


--
-- TOC entry 5099 (class 1259 OID 42723)
-- Name: idx_access_logs_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_access_logs_usuario ON public.access_logs USING btree (usuario_id);


--
-- TOC entry 5159 (class 1259 OID 51164)
-- Name: idx_ai_book_metadata_book_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_book_metadata_book_id ON public.ai_book_metadata USING btree (book_id);


--
-- TOC entry 5160 (class 1259 OID 51163)
-- Name: idx_ai_book_metadata_mood_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_book_metadata_mood_key ON public.ai_book_metadata USING btree (mood_key);


--
-- TOC entry 5102 (class 1259 OID 42746)
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_action ON public.audit_trail USING btree (action);


--
-- TOC entry 5103 (class 1259 OID 42747)
-- Name: idx_audit_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_categoria ON public.audit_trail USING btree (categoria);


--
-- TOC entry 5104 (class 1259 OID 42748)
-- Name: idx_audit_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_criado ON public.audit_trail USING btree (criado_em DESC);


--
-- TOC entry 5105 (class 1259 OID 42749)
-- Name: idx_audit_target; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_target ON public.audit_trail USING btree (target_type, target_id);


--
-- TOC entry 5106 (class 1259 OID 42750)
-- Name: idx_audit_target_info; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_target_info ON public.audit_trail USING gin (target_info);


--
-- TOC entry 5107 (class 1259 OID 42745)
-- Name: idx_audit_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_usuario ON public.audit_trail USING btree (usuario_id);


--
-- TOC entry 5062 (class 1259 OID 25487)
-- Name: idx_auditoria_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auditoria_usuario_id ON public."Auditoria_Acoes" USING btree (usuario_id);


--
-- TOC entry 5030 (class 1259 OID 25381)
-- Name: idx_autor_nome; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_autor_nome ON public.autor USING btree (nome);


--
-- TOC entry 5125 (class 1259 OID 51013)
-- Name: idx_avaliacoes_autor_autor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_autor_autor_id ON public.avaliacoes_autor USING btree (autor_id);


--
-- TOC entry 5126 (class 1259 OID 51015)
-- Name: idx_avaliacoes_autor_data_criacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_autor_data_criacao ON public.avaliacoes_autor USING btree (data_criacao DESC);


--
-- TOC entry 5127 (class 1259 OID 51016)
-- Name: idx_avaliacoes_autor_nota; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_autor_nota ON public.avaliacoes_autor USING btree (nota);


--
-- TOC entry 5128 (class 1259 OID 51014)
-- Name: idx_avaliacoes_autor_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_autor_usuario_id ON public.avaliacoes_autor USING btree (usuario_id);


--
-- TOC entry 5119 (class 1259 OID 42906)
-- Name: idx_avaliacoes_livro_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_livro_id ON public.avaliacoes USING btree (livro_id);


--
-- TOC entry 5120 (class 1259 OID 42907)
-- Name: idx_avaliacoes_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avaliacoes_usuario_id ON public.avaliacoes USING btree (usuario_id);


--
-- TOC entry 5133 (class 1259 OID 51035)
-- Name: idx_curtidas_data_criacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_curtidas_data_criacao ON public.curtidas_comentario USING btree (data_criacao DESC);


--
-- TOC entry 5134 (class 1259 OID 51033)
-- Name: idx_curtidas_tipo_comentario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_curtidas_tipo_comentario ON public.curtidas_comentario USING btree (tipo_comentario, comentario_id);


--
-- TOC entry 5135 (class 1259 OID 51034)
-- Name: idx_curtidas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_curtidas_usuario_id ON public.curtidas_comentario USING btree (usuario_id);


--
-- TOC entry 5071 (class 1259 OID 42572)
-- Name: idx_dominio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dominio ON public.dominios_permitidos USING btree (dominio);


--
-- TOC entry 5072 (class 1259 OID 42573)
-- Name: idx_dominio_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dominio_ativo ON public.dominios_permitidos USING btree (ativo);


--
-- TOC entry 5047 (class 1259 OID 42828)
-- Name: idx_emprestimo_data_expiracao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emprestimo_data_expiracao ON public.emprestimo USING btree (data_expiracao) WHERE ((tipo)::text = 'reserva'::text);


--
-- TOC entry 5048 (class 1259 OID 42827)
-- Name: idx_emprestimo_status_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emprestimo_status_tipo ON public.emprestimo USING btree (status, tipo);


--
-- TOC entry 5049 (class 1259 OID 42825)
-- Name: idx_emprestimo_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emprestimo_tipo ON public.emprestimo USING btree (tipo);


--
-- TOC entry 5050 (class 1259 OID 42826)
-- Name: idx_emprestimo_usuario_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emprestimo_usuario_tipo ON public.emprestimo USING btree (usuario_id, tipo);


--
-- TOC entry 5014 (class 1259 OID 42577)
-- Name: idx_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_google_id ON public.usuario USING btree (google_id);


--
-- TOC entry 5035 (class 1259 OID 42538)
-- Name: idx_livro_preco; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_livro_preco ON public.livro USING btree (preco);


--
-- TOC entry 5036 (class 1259 OID 25379)
-- Name: idx_livro_titulo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_livro_titulo ON public.livro USING btree (titulo);


--
-- TOC entry 5143 (class 1259 OID 51090)
-- Name: idx_notificacoes_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacoes_usuario ON public.notificacoes USING btree (usuario_id);


--
-- TOC entry 5108 (class 1259 OID 42777)
-- Name: idx_notifications_criado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_criado ON public.notifications_sent USING btree (criado_em DESC);


--
-- TOC entry 5109 (class 1259 OID 42774)
-- Name: idx_notifications_destinatario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_destinatario ON public.notifications_sent USING btree (destinatario_id);


--
-- TOC entry 5110 (class 1259 OID 42773)
-- Name: idx_notifications_enviado_por; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_enviado_por ON public.notifications_sent USING btree (enviado_por);


--
-- TOC entry 5111 (class 1259 OID 42776)
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_status ON public.notifications_sent USING btree (status);


--
-- TOC entry 5112 (class 1259 OID 42775)
-- Name: idx_notifications_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_tipo ON public.notifications_sent USING btree (tipo);


--
-- TOC entry 5073 (class 1259 OID 42650)
-- Name: idx_permissions_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permissions_categoria ON public.permissions USING btree (categoria);


--
-- TOC entry 5074 (class 1259 OID 42649)
-- Name: idx_permissions_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_permissions_code ON public.permissions USING btree (code);


--
-- TOC entry 5146 (class 1259 OID 51112)
-- Name: idx_preferencias_aluno; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_preferencias_aluno ON public.preferencias_aluno USING btree (aluno_id);


--
-- TOC entry 5138 (class 1259 OID 51054)
-- Name: idx_respostas_data_criacao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respostas_data_criacao ON public.respostas_comentario USING btree (data_criacao DESC);


--
-- TOC entry 5139 (class 1259 OID 51052)
-- Name: idx_respostas_tipo_comentario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respostas_tipo_comentario ON public.respostas_comentario USING btree (tipo_comentario, comentario_id);


--
-- TOC entry 5140 (class 1259 OID 51053)
-- Name: idx_respostas_usuario_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_respostas_usuario_id ON public.respostas_comentario USING btree (usuario_id);


--
-- TOC entry 5085 (class 1259 OID 42689)
-- Name: idx_role_permissions_permission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id);


--
-- TOC entry 5086 (class 1259 OID 42688)
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id);


--
-- TOC entry 5079 (class 1259 OID 42667)
-- Name: idx_roles_ativo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_ativo ON public.roles USING btree (ativo);


--
-- TOC entry 5080 (class 1259 OID 42666)
-- Name: idx_roles_nome; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_nome ON public.roles USING btree (nome);


--
-- TOC entry 5059 (class 1259 OID 25432)
-- Name: idx_transacao_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transacao_tipo ON public."Transacao_Financeira" USING btree (tipo);


--
-- TOC entry 5015 (class 1259 OID 42702)
-- Name: idx_usuario_blocked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_blocked ON public.usuario USING btree (is_blocked);


--
-- TOC entry 5016 (class 1259 OID 25380)
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);


--
-- TOC entry 5017 (class 1259 OID 42701)
-- Name: idx_usuario_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_role ON public.usuario USING btree (role_id);


--
-- TOC entry 5202 (class 2620 OID 42532)
-- Name: pedido tg_registrar_transacao_venda; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tg_registrar_transacao_venda AFTER INSERT ON public.pedido FOR EACH ROW EXECUTE FUNCTION public.registrar_transacao_venda();


--
-- TOC entry 5203 (class 2620 OID 42535)
-- Name: pedido tr_pedido_cancelado; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_pedido_cancelado AFTER UPDATE ON public.pedido FOR EACH ROW EXECUTE FUNCTION public.finalizar_pedido_cancelado();


--
-- TOC entry 5201 (class 2620 OID 51093)
-- Name: emprestimo trg_atualizar_num_emprestimos; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_atualizar_num_emprestimos AFTER INSERT ON public.emprestimo FOR EACH ROW EXECUTE FUNCTION public.atualizar_num_emprestimos();


--
-- TOC entry 5204 (class 2620 OID 42779)
-- Name: access_logs trigger_access_logs_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_access_logs_updated BEFORE UPDATE ON public.access_logs FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();


--
-- TOC entry 5205 (class 2620 OID 42796)
-- Name: access_logs trigger_calculate_session_duration; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calculate_session_duration BEFORE UPDATE ON public.access_logs FOR EACH ROW EXECUTE FUNCTION public.calculate_session_duration();


--
-- TOC entry 5207 (class 2620 OID 51183)
-- Name: integrations trigger_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_integrations_updated_at();


--
-- TOC entry 5206 (class 2620 OID 42780)
-- Name: notifications_sent trigger_notifications_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notifications_updated BEFORE UPDATE ON public.notifications_sent FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();


--
-- TOC entry 5178 (class 2606 OID 25482)
-- Name: Auditoria_Acoes Auditoria_Acoes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Auditoria_Acoes"
    ADD CONSTRAINT "Auditoria_Acoes_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5176 (class 2606 OID 25427)
-- Name: Transacao_Financeira Transacao_Financeira_emprestimo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transacao_Financeira"
    ADD CONSTRAINT "Transacao_Financeira_emprestimo_id_fkey" FOREIGN KEY (emprestimo_id) REFERENCES public.emprestimo(id) ON DELETE SET NULL;


--
-- TOC entry 5177 (class 2606 OID 25422)
-- Name: Transacao_Financeira Transacao_Financeira_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transacao_Financeira"
    ADD CONSTRAINT "Transacao_Financeira_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- TOC entry 5186 (class 2606 OID 42718)
-- Name: access_logs access_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- TOC entry 5199 (class 2606 OID 51153)
-- Name: ai_book_metadata ai_book_metadata_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_book_metadata
    ADD CONSTRAINT ai_book_metadata_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.livro(id) ON DELETE CASCADE;


--
-- TOC entry 5200 (class 2606 OID 51158)
-- Name: ai_book_metadata ai_book_metadata_mood_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_book_metadata
    ADD CONSTRAINT ai_book_metadata_mood_key_fkey FOREIGN KEY (mood_key) REFERENCES public.moods(key) ON DELETE SET NULL;


--
-- TOC entry 5187 (class 2606 OID 42740)
-- Name: audit_trail audit_trail_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- TOC entry 5191 (class 2606 OID 42896)
-- Name: avaliacoes avaliacoes_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id) ON DELETE CASCADE;


--
-- TOC entry 5192 (class 2606 OID 42901)
-- Name: avaliacoes avaliacoes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5183 (class 2606 OID 42567)
-- Name: dominios_permitidos dominios_permitidos_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dominios_permitidos
    ADD CONSTRAINT dominios_permitidos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuario(id);


--
-- TOC entry 5168 (class 2606 OID 25326)
-- Name: emprestimo emprestimo_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emprestimo
    ADD CONSTRAINT emprestimo_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id);


--
-- TOC entry 5169 (class 2606 OID 25321)
-- Name: emprestimo emprestimo_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emprestimo
    ADD CONSTRAINT emprestimo_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- TOC entry 5193 (class 2606 OID 51003)
-- Name: avaliacoes_autor fk_autor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes_autor
    ADD CONSTRAINT fk_autor FOREIGN KEY (autor_id) REFERENCES public.autor(id) ON DELETE CASCADE;


--
-- TOC entry 5194 (class 2606 OID 51008)
-- Name: avaliacoes_autor fk_usuario_avaliacao_autor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avaliacoes_autor
    ADD CONSTRAINT fk_usuario_avaliacao_autor FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5195 (class 2606 OID 51028)
-- Name: curtidas_comentario fk_usuario_curtida; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.curtidas_comentario
    ADD CONSTRAINT fk_usuario_curtida FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5179 (class 2606 OID 42510)
-- Name: pedido fk_usuario_pedido; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT fk_usuario_pedido FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- TOC entry 5196 (class 2606 OID 51047)
-- Name: respostas_comentario fk_usuario_resposta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respostas_comentario
    ADD CONSTRAINT fk_usuario_resposta FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 42526)
-- Name: item_pedido item_pedido_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_pedido
    ADD CONSTRAINT item_pedido_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id);


--
-- TOC entry 5182 (class 2606 OID 42521)
-- Name: item_pedido item_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_pedido
    ADD CONSTRAINT item_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedido(id) ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 25359)
-- Name: livro_autor livro_autor_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro_autor
    ADD CONSTRAINT livro_autor_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.autor(id) ON DELETE CASCADE;


--
-- TOC entry 5173 (class 2606 OID 25354)
-- Name: livro_autor livro_autor_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro_autor
    ADD CONSTRAINT livro_autor_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 25374)
-- Name: livro_categoria livro_categoria_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro_categoria
    ADD CONSTRAINT livro_categoria_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 25369)
-- Name: livro_categoria livro_categoria_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.livro_categoria
    ADD CONSTRAINT livro_categoria_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id) ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 42811)
-- Name: notificacao notificacao_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacao
    ADD CONSTRAINT notificacao_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5197 (class 2606 OID 51085)
-- Name: notificacoes notificacoes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 42768)
-- Name: notifications_sent notifications_sent_destinatario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications_sent
    ADD CONSTRAINT notifications_sent_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- TOC entry 5189 (class 2606 OID 42763)
-- Name: notifications_sent notifications_sent_enviado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications_sent
    ADD CONSTRAINT notifications_sent_enviado_por_fkey FOREIGN KEY (enviado_por) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- TOC entry 5180 (class 2606 OID 42505)
-- Name: pedido pedido_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- TOC entry 5198 (class 2606 OID 51107)
-- Name: preferencias_aluno preferencias_aluno_aluno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias_aluno
    ADD CONSTRAINT preferencias_aluno_aluno_id_fkey FOREIGN KEY (aluno_id) REFERENCES public.usuario(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 25344)
-- Name: reserva reserva_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id);


--
-- TOC entry 5171 (class 2606 OID 25339)
-- Name: reserva reserva_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id);


--
-- TOC entry 5167 (class 2606 OID 25308)
-- Name: resumo_ia resumo_ia_livro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumo_ia
    ADD CONSTRAINT resumo_ia_livro_id_fkey FOREIGN KEY (livro_id) REFERENCES public.livro(id) ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 42683)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 5185 (class 2606 OID 42678)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 42696)
-- Name: usuario usuario_blocked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_blocked_by_fkey FOREIGN KEY (blocked_by) REFERENCES public.usuario(id) ON DELETE SET NULL;


--
-- TOC entry 5166 (class 2606 OID 42691)
-- Name: usuario usuario_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


-- Completed on 2026-05-15 20:23:51

--
-- PostgreSQL database dump complete
--

