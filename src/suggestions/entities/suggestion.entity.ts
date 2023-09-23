import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Suggestion {
  @PrimaryColumn()
  id?: number;

  @Column()
  key: string;

  @Column()
  sugg: string;

  @Column()
  freq: number;
}
