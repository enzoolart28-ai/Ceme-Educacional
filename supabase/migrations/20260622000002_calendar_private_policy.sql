-- =============================================================================
-- Migration: Calendário — eventos privados (somente o criador vê)
-- =============================================================================
-- Recria as políticas de SELECT/INSERT para suportar visibility = 'private':
--   • SELECT: evento privado é visível SOMENTE para quem o criou — nem a equipe
--     (is_staff) enxerga eventos privados de outra pessoa.
--   • INSERT: qualquer usuário autenticado pode criar um evento pessoal (private)
--     para si; os demais tipos continuam restritos a staff/financeiro/professor.
-- =============================================================================

-- ---- SELECT --------------------------------------------------------------
drop policy if exists "calendar_events_select" on public.calendar_events;
create policy "calendar_events_select" on public.calendar_events
  for select to authenticated
  using (
    created_by = public.current_profile_id()              -- sempre vejo o que criei (inclui privados)
    or (
      visibility <> 'private' and (                        -- privados: só pelo criador (acima)
        visibility = 'public'
        or public.is_staff()
        or (type = 'vencimento_financeiro' and public.has_permission('finance.read'))
        or (
          class_id is not null and (
            public.is_enrolled(class_id)
            or public.teaches_class(class_id)
            or exists (
              select 1 from public.class_students cs
                join public.students s on s.id = cs.student_id
               where cs.class_id = calendar_events.class_id and public.guards_student(s.id)
            )
          )
        )
        or (
          course_id is not null and (
            public.enrolled_in_course(course_id)
            or public.guardian_of_course_student(course_id)
            or exists (
              select 1 from public.classes c
               where c.course_id = calendar_events.course_id and public.teaches_class(c.id)
            )
          )
        )
      )
    )
  );

-- ---- INSERT --------------------------------------------------------------
drop policy if exists "calendar_events_insert" on public.calendar_events;
create policy "calendar_events_insert" on public.calendar_events
  for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and (
      visibility = 'private'                                -- evento pessoal: liberado a qualquer um (só pra si)
      or public.is_staff()
      or (type = 'vencimento_financeiro' and public.has_permission('finance.manage'))
      or (class_id is not null and public.teaches_class(class_id))
    )
  );
